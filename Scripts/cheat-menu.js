(function() {
    'use strict';
    if (window !== window.top) return;
    if (window._bcCheatMenuLoaded) return;
    window._bcCheatMenuLoaded = true;

    const cheats = [
        {
            name: "Unlock & Remove Restraint",
            desc: "Unlocks and removes the restraint you are currently looking at/focusing on.",
            action: () => {
                if (typeof CurrentCharacter !== 'undefined' && CurrentCharacter && CurrentCharacter.FocusGroup) {
                    InventoryUnlock(CurrentCharacter, CurrentCharacter.FocusGroup.Name);
                    InventoryRemove(CurrentCharacter, CurrentCharacter.FocusGroup.Name);
                    ChatRoomCharacterItemUpdate(CurrentCharacter, CurrentCharacter.FocusGroup.Name);
                    console.log("Cheat applied: Restraint removed.");
                } else {
                    alert("Please focus/click on a restraint first!");
                }
            }
        },
        {
            name: "Instant Struggle Win",
            desc: "Instantly sets struggle progress to max.",
            action: () => {
                if (typeof StruggleProgress !== 'undefined') {
                    window.StruggleProgress = 1000;
                    console.log("Cheat applied: Struggle progress maxed.");
                } else {
                    alert("You are not currently struggling!");
                }
            }
        },
        {
            name: "Force Full Wardrobe Access",
            desc: "Allows full wardrobe access, bypassing limits. Useful for NPCs.",
            action: () => {
                if (typeof CharacterAppearanceSelection !== 'undefined') {
                    CharacterAppearanceSelection.OnlineSharedSettings = { AllowFullWardrobeAccess: true };
                    console.log("Cheat applied: Full wardrobe access granted.");
                    alert("Wardrobe access unlocked! You can now open the wardrobe.");
                }
            }
        },
        {
            name: "Remove Blocked Zones",
            desc: "Bypasses all item zone blocks and prerequisite restrictions. Allows equipping anything anywhere.",
            action: () => {
                if (typeof InventoryGroupIsBlocked === 'function') {
                    window.InventoryGroupIsBlocked = function(C, GroupName) { return false; };
                    window.InventoryPrerequisiteMessage = function(C, Prerequisit) { return ""; };
                    console.log("Cheat applied: Blocked zones removed.");
                    alert("All zone blocks and prerequisites bypassed!");
                } else {
                    alert("Game functions not loaded yet!");
                }
            }
        },
        {
            name: "Unlock All Outfits",
            desc: "Adds every outfit/item in the game to your inventory and syncs to server.",
            action: () => {
                if (typeof AssetFemale3DCG !== 'undefined' && typeof Player !== 'undefined' && typeof InventoryAdd === 'function') {
                    AssetFemale3DCG.forEach(group => group.Asset.forEach(item => InventoryAdd(Player, item.Name, group.Group, false)));
                    if (typeof ServerPlayerInventorySync === 'function') ServerPlayerInventorySync();
                    console.log("Cheat applied: All outfits unlocked.");
                    alert("All items have been added to your inventory!");
                } else {
                    alert("Game not fully loaded yet!");
                }
            }
        },
        {
            // ponytail: wraps prereq checker — only targets 拉到身边, swaps UseHands→UseMouth fallback
            name: "Unlock Pull to One Side (Mouth)",
            desc: "Allows 'Pull to One Side' even with tied hands — uses mouth if free. Bypasses Echo leash prereqs for this activity only.",
            action: () => {
                if (typeof ActivityCheckPrerequisite !== 'function' || typeof ActivityCheckPrerequisites !== 'function') {
                    alert("Game functions not loaded yet!"); return;
                }

                const TARGET = "拉到身边";
                const origCheck = window.ActivityCheckPrerequisite;
                const origChecks = window.ActivityCheckPrerequisites;

                // Wrap per-prereq checker: for UseHands on Pull to One Side, fall back to mouth-free
                // Luzi_* custom prereqs → always pass (for this activity, handled by wrapper below)
                window.ActivityCheckPrerequisite = function(prereq, acting, acted, group) {
                    if (window._pullToSideActive) {
                        if (prereq === "UseHands")
                            return !acting.IsMouthBlocked() || origCheck.call(this, prereq, acting, acted, group);
                        if (typeof prereq === 'string' && prereq.startsWith('Luzi_'))
                            return true;
                    }
                    return origCheck.call(this, prereq, acting, acted, group);
                };

                // Wrap per-activity checker: set flag when checking Pull to One Side,
                // also force function-based prereqs (Echo's Prereqs.any/all) to pass
                window.ActivityCheckPrerequisites = function(activity, acting, acted, group) {
                    if (activity.Name === TARGET) {
                        window._pullToSideActive = true;
                        try {
                            if (!activity.Prerequisite) return true;
                            return activity.Prerequisite.every(pre => {
                                if (typeof pre === 'function') return true;
                                return window.ActivityCheckPrerequisite(pre, acting, acted, group);
                            });
                        } finally {
                            window._pullToSideActive = false;
                        }
                    }
                    return origChecks.call(this, activity, acting, acted, group);
                };

                // Also ensure ChatRoomCanBeLeashed passes when called from Echo's Luzi prereqs
                if (typeof ChatRoomCanBeLeashed === 'function') {
                    const origLeash = window.ChatRoomCanBeLeashed;
                    window.ChatRoomCanBeLeashed = function() {
                        if (window._pullToSideActive) return true;
                        return origLeash.apply(this, arguments);
                    };
                }

                console.log("Cheat applied: Pull to One Side (mouth mode) enabled.");
                alert("'Pull to One Side' unlocked!\nHands tied? Uses mouth if free.\nEcho leash restrictions bypassed for this activity only.");
            }
        }
    ];

    // --- Profile menu button (below chat-qol gear button) ---
    const cheatBtn = document.createElement("div");
    cheatBtn.innerHTML = `<img src="https://raw.githubusercontent.com/Izumii99/BC-Desktop/main/Assets/cheat_ui.png" style="width: 100%; height: 100%; object-fit: cover; display: block; border-radius: 10px;">`;
    Object.assign(cheatBtn.style, {
        position: "fixed",
        top: "76px",
        left: "20px",
        width: "44px",
        height: "44px",
        backgroundColor: "#14121E",
        borderRadius: "10px",
        padding: "0",
        overflow: "hidden",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        border: "1px solid #1A1825",
        display: "none",
        justifyContent: "center",
        alignItems: "center",
        cursor: "pointer",
        zIndex: "2147483646",
        transition: "transform 0.2s",
        userSelect: "none",
        boxSizing: "border-box"
    });
    cheatBtn.onmouseenter = () => { cheatBtn.style.transform = "scale(1.1)"; };
    cheatBtn.onmouseleave = () => { cheatBtn.style.transform = "scale(1)"; };

    // --- Modal overlay ---
    const cheatModal = document.createElement("div");
    Object.assign(cheatModal.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
        zIndex: "2147483647",
        display: "none",
        justifyContent: "center",
        alignItems: "center"
    });

    const cheatContent = document.createElement("div");
    Object.assign(cheatContent.style, {
        backgroundColor: "#1a1625",
        width: "380px",
        maxWidth: "90%",
        maxHeight: "85%",
        borderRadius: "16px",
        boxShadow: "0 12px 40px rgba(0,0,0,0.8)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        border: "1px solid #2e2640",
        color: "#f5f5f5",
        fontFamily: "'Inter', Arial, sans-serif"
    });

    const cheatHeader = document.createElement("div");
    Object.assign(cheatHeader.style, {
        backgroundColor: "#211c2e",
        padding: "18px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid #2e2640",
        fontWeight: "bold",
        fontSize: "16px"
    });
    cheatHeader.innerHTML = `<span>Cheat Menu</span>`;

    const cheatClose = document.createElement("div");
    cheatClose.innerHTML = "✖";
    Object.assign(cheatClose.style, {
        cursor: "pointer",
        fontSize: "18px",
        color: "#8a81a8",
        transition: "color 0.2s"
    });
    cheatClose.onmouseenter = () => (cheatClose.style.color = "#f5f5f5");
    cheatClose.onmouseleave = () => (cheatClose.style.color = "#8a81a8");
    cheatClose.onclick = () => (cheatModal.style.display = "none");
    cheatHeader.appendChild(cheatClose);

    const cheatBody = document.createElement("div");
    Object.assign(cheatBody.style, {
        padding: "20px 24px",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "8px"
    });

    cheats.forEach(cheat => {
        const item = document.createElement("div");
        Object.assign(item.style, {
            padding: "12px 16px",
            cursor: "pointer",
            transition: "background-color 0.2s",
            userSelect: "none",
            borderRadius: "8px",
            backgroundColor: "#211c2e",
            border: "1px solid #2e2640"
        });

        const name = document.createElement("div");
        name.innerText = cheat.name;
        Object.assign(name.style, { fontWeight: "500", fontSize: "14px", marginBottom: "4px" });

        const desc = document.createElement("div");
        desc.innerText = cheat.desc;
        Object.assign(desc.style, { fontSize: "11px", color: "#a59fb5", lineHeight: "1.3" });

        item.appendChild(name);
        item.appendChild(desc);

        item.onmouseenter = () => { item.style.backgroundColor = "#3d3554"; };
        item.onmouseleave = () => { item.style.backgroundColor = "#211c2e"; };
        item.onclick = () => {
            cheat.action();
            cheatModal.style.display = "none";
        };
        cheatBody.appendChild(item);
    });

    cheatContent.appendChild(cheatHeader);
    cheatContent.appendChild(cheatBody);
    cheatModal.appendChild(cheatContent);

    let uiAppended = false;

    const BUTTON_SCREENS = ["Login", "InformationSheet", "Appearance"];

    function isChatRoom() {
        return typeof CurrentScreen !== "undefined" && CurrentScreen === "ChatRoom";
    }

    function openCheatMenu() {
        cheatModal.style.display = "flex";
    }

    function closeCheatMenu() {
        cheatModal.style.display = "none";
    }

    function isCheatUi(el) {
        return !!(el && (cheatModal.contains(el) || cheatBtn.contains(el)));
    }

    cheatBtn.onclick = () => openCheatMenu();
    cheatModal.onclick = (e) => { if (e.target === cheatModal) closeCheatMenu(); };
    document.addEventListener(
        "keydown",
        (e) => {
            if (e.key !== "Escape") return;
            if (cheatModal.style.display !== "flex") return;
            e.preventDefault();
            e.stopPropagation();
            closeCheatMenu();
        },
        true,
    );

    // WebView2 sets AreDefaultContextMenusEnabled = false, so the DOM
    // "contextmenu" event is often never dispatched. The game canvas also
    // only binds HTML onclick, which never fires for button 2. Listen to
    // the right-mouse release itself, and keep contextmenu as a fallback.
    function onChatRightClick(e) {
        if (!isChatRoom()) return;
        if (isCheatUi(e.target)) return;
        if (e.type !== "contextmenu" && e.button !== 2) return;
        e.preventDefault();
        e.stopPropagation();
        openCheatMenu();
    }

    document.addEventListener("mouseup", onChatRightClick, true);
    document.addEventListener("contextmenu", onChatRightClick, true);

    // ponytail: reuses the same polling pattern as chat-qol.js for screen visibility
    setInterval(() => {
        try {
            if (!uiAppended && document.body) {
                document.body.appendChild(cheatBtn);
                document.body.appendChild(cheatModal);
                uiAppended = true;
            }

            if (
                typeof CurrentScreen !== "undefined" &&
                BUTTON_SCREENS.indexOf(CurrentScreen) !== -1
            ) {
                cheatBtn.style.display = "flex";
            } else {
                cheatBtn.style.display = "none";
                // Leave an already-open menu alone on ChatRoom (opened via right-click)
                if (!isChatRoom()) closeCheatMenu();
            }
        } catch (e) {}
    }, 2000);

    console.log("BC Desktop: Cheat Menu Addon loaded.");
})();
