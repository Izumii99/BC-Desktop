/**
 * Fix for Third-Party Craft Sharing in BC
 * Allows using shared crafted items from other people in the room on third parties.
 */
(function() {
    console.log("Loading Craft Share Fix...");

    // Hook DialogCanUseCraftedItem to bypass the ownership check for shared crafts
    if (typeof window.DialogCanUseCraftedItem === "function") {
        const origDialogCanUseCraftedItem = window.DialogCanUseCraftedItem;
        window.DialogCanUseCraftedItem = function(C, Craft, Asset) {
            let res = origDialogCanUseCraftedItem(C, Craft, Asset);
            
            // If native check failed, it might be due to third-party ownership
            if (!res && Craft && Craft.MemberNumber && typeof ChatRoomCharacter !== "undefined") {
                const owner = ChatRoomCharacter.find(c => c.MemberNumber === Craft.MemberNumber);
                if (owner && owner.MemberNumber !== Player.MemberNumber && owner.MemberNumber !== C.MemberNumber) {
                    
                    // Check if owner allows sharing (Native BC or LSCG)
                    let allowsShare = false;
                    
                    if (owner.OnlineSharedSettings) {
                        if (owner.OnlineSharedSettings.AllowCraftingShare || 
                            owner.OnlineSharedSettings.ShareCrafts ||
                            owner.OnlineSharedSettings.ShareCrafting ||
                            owner.OnlineSharedSettings.AllowSharedCrafts ||
                            owner.OnlineSharedSettings.AllowCrafts) {
                            allowsShare = true;
                        }
                    }
                    
                    if (owner.LSCG && owner.LSCG.GlobalModule && owner.LSCG.GlobalModule.sharePublicCrafting) {
                        allowsShare = true;
                    }

                    // If owner allows, pretend it's ours and re-evaluate to maintain other restrictions
                    if (allowsShare) {
                        const fakeCraft = Object.assign({}, Craft, { MemberNumber: Player.MemberNumber });
                        return origDialogCanUseCraftedItem(C, fakeCraft, Asset);
                    }
                }
            }
            return res;
        };
    }

    // In case BC natively doesn't pull crafts from other players in the room when looking at a third party,
    // we also inject a hook into DialogInventoryBuild to populate them.
    if (typeof window.DialogInventoryBuild === "function") {
        const origDialogInventoryBuild = window.DialogInventoryBuild;
        window.DialogInventoryBuild = function(C, Offset, updateMenu) {
            origDialogInventoryBuild(C, Offset, updateMenu);
            
            if (C && C.MemberNumber !== Player.MemberNumber && typeof ChatRoomCharacter !== "undefined" && window.DialogMenuMode !== "permissions") {
                ChatRoomCharacter.forEach(owner => {
                    if (owner.MemberNumber === Player.MemberNumber || owner.MemberNumber === C.MemberNumber) return;
                    if (!owner.Crafting) return;
                    
                    let allowsShare = false;
                    if (owner.OnlineSharedSettings) {
                        if (owner.OnlineSharedSettings.AllowCraftingShare || 
                            owner.OnlineSharedSettings.ShareCrafts ||
                            owner.OnlineSharedSettings.ShareCrafting ||
                            owner.OnlineSharedSettings.AllowSharedCrafts ||
                            owner.OnlineSharedSettings.AllowCrafts) {
                            allowsShare = true;
                        }
                    }
                    if (owner.LSCG && owner.LSCG.GlobalModule && owner.LSCG.GlobalModule.sharePublicCrafting) {
                        allowsShare = true;
                    }
                    
                    if (allowsShare) {
                        let craftingData = typeof CraftingDecompressServerData === "function" ? CraftingDecompressServerData(owner.Crafting) : owner.Crafting;
                        if (!Array.isArray(craftingData)) return;
                        
                        craftingData.forEach(Craft => {
                            if (Craft && Craft.Item && !Craft.Private) {
                                Craft.MemberName = typeof CharacterNickname === "function" ? CharacterNickname(owner) : owner.Name;
                                Craft.MemberNumber = owner.MemberNumber;
                                
                                const assets = window.CraftingAssets ? window.CraftingAssets[Craft.Item] : [];
                                if (assets) {
                                    assets.forEach(Asset => {
                                        if (C.FocusGroup && Asset.Group.Name === C.FocusGroup.Name) {
                                            if (typeof window.DialogCanUseCraftedItem === "function" && window.DialogCanUseCraftedItem(C, Craft, Asset)) {
                                                if (typeof window.DialogInventoryAdd === "function") {
                                                    // Depending on BC version, DialogInventoryAdd might take 3 or 4 arguments
                                                    // C, Item, IsCurrentItem, SortOrder
                                                    window.DialogInventoryAdd(C, { Asset: Asset, Craft: Craft }, false);
                                                }
                                            }
                                        }
                                    });
                                }
                            }
                        });
                    }
                });
                if (typeof window.DialogInventorySort === "function") window.DialogInventorySort();
            }
        };
    }
})();
