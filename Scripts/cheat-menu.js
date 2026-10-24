(function() {
    'use strict';
    if (window !== window.top) return;
    if (window._bcCheatMenuLoaded) return;
    window._bcCheatMenuLoaded = true;
    const cheats = [
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
            name: "Toggle Auto Mirror Restraints",
            desc: "Automatically removes any restraint someone else puts on you and puts it back on them.",
            action: () => {
                if (typeof window === 'undefined' || !window.Player) {
                    alert("Game not fully loaded yet!");
                    return;
                }
                
                if (window._autoMirrorActive) {
                    window._autoMirrorActive = false;
                    if (window._autoMirrorInterval) {
                        clearInterval(window._autoMirrorInterval);
                        window._autoMirrorInterval = null;
                    }
                    alert("Auto Mirror Restraints: OFF");
                    console.log("Cheat applied: Auto Mirror OFF");
                    return;
                }
                
                window._autoMirrorActive = true;
                alert("Auto Mirror Restraints: ON. Anyone who restrains you will be restrained themselves!");
                console.log("Cheat applied: Auto Mirror ON");
                
                if (!window._autoMirrorHooked) {
                    window._autoMirrorHooked = true;
                    
                    // Track the last person who targeted us
                    window._lastTargeter = null;
                    const origChatRoomMessage = window.ChatRoomMessage;
                    window.ChatRoomMessage = function(data) {
                        if (origChatRoomMessage) origChatRoomMessage(data);
                        
                        if (data && data.Dictionary) {
                            let otherMember = null;
                            let mentionsUs = false;
                            
                            if (Array.isArray(data.Dictionary)) {
                                data.Dictionary.forEach(d => {
                                    if (d.MemberNumber) {
                                        if (d.MemberNumber === window.Player.MemberNumber) {
                                            mentionsUs = true;
                                        } else {
                                            otherMember = d.MemberNumber;
                                        }
                                    }
                                });
                            }
                            
                            // If this message involves us and someone else, assume they are the last targeter
                            if (mentionsUs && otherMember) {
                                window._lastTargeter = otherMember;
                            }
                        }
                    };

                    // Monitor Appearance changes
                    window._lastAppearance = window.Player.Appearance.map(a => a.Asset.Name + a.Asset.Group.Name);
                    
                    window._runAutoMirror = function() {
                        if (!window._autoMirrorActive || !window.Player || !window.Player.Appearance) return;
                        
                        const currentAppearance = window.Player.Appearance;
                        const currentItems = currentAppearance.map(a => a.Asset.Name + a.Asset.Group.Name);
                        
                        // Find items that are newly added to us
                        const added = currentAppearance.filter(a => !window._lastAppearance.includes(a.Asset.Name + a.Asset.Group.Name));
                        
                        if (added.length > 0) {
                            added.forEach(newItem => {
                                const group = newItem.Asset.Group.Name;
                                // Only mirror items (restraints/toys), not normal clothes
                                if (group.startsWith("Item")) {
                                    console.log("Auto Mirror detected new item:", newItem.Asset.Name, group);
                                    
                                    setTimeout(() => {
                                        let targetMember = window._lastTargeter;
                                        if (!targetMember) {
                                            // Fallback: find the first other player in the room
                                            const other = window.ChatRoomCharacter && window.ChatRoomCharacter.find(c => c.MemberNumber !== window.Player.MemberNumber);
                                            if (other) targetMember = other.MemberNumber;
                                        }
                                        
                                        if (targetMember) {
                                            const targetChar = window.ChatRoomCharacter && window.ChatRoomCharacter.find(c => c.MemberNumber === targetMember);
                                            if (targetChar) {
                                                // 1. Remove from us
                                                window.InventoryRemove(window.Player, group);
                                                window.ChatRoomCharacterItemUpdate(window.Player, group);
                                                
                                                // 2. Put on them
                                                window.InventoryWear(targetChar, newItem.Asset.Name, group, newItem.Color);
                                                const itemOnThem = window.InventoryGet(targetChar, group);
                                                if (itemOnThem && newItem.Property) {
                                                    itemOnThem.Property = Object.assign({}, newItem.Property);
                                                }
                                                window.ChatRoomCharacterItemUpdate(targetChar, group);
                                                
                                                // 3. Emote
                                                window.ServerSend("ChatRoomChat", {
                                                    Content: `*swiftly deflects the restraint and secures it onto ${targetChar.Name} instead!*`,
                                                    Type: "Emote",
                                                    Dictionary: []
                                                });
                                                console.log("Auto Mirror bounced to:", targetChar.Name);
                                            }
                                        } else {
                                            // Fallback: just remove it if we don't know who did it
                                            window.InventoryRemove(window.Player, group);
                                            window.ChatRoomCharacterItemUpdate(window.Player, group);
                                            console.log("Auto Mirror removed item but couldn't find source to bounce to.");
                                        }
                                    }, 200);
                                }
                            });
                        }
                        
                        // Update our baseline
                        window._lastAppearance = currentItems;
                    };
                }

                if (window._autoMirrorActive && !window._autoMirrorInterval && window._runAutoMirror) {
                    window._autoMirrorInterval = setInterval(window._runAutoMirror, 500);
                }
            }
        },
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

            name: "Unlock Pull to One Side (Mouth)",
            desc: "Allows 'Pull to One Side' even with tied hands — uses mouth if free. Bypasses Echo leash prereqs for this activity only.",
            action: () => {
                if (typeof ActivityCheckPrerequisite !== 'function' || typeof ActivityCheckPrerequisites !== 'function') {
                    alert("Game functions not loaded yet!"); return;
                }

                if (window._echoMouthHooksApplied || (typeof qolConfig !== 'undefined' && qolConfig.enableEchoMouthPull)) {
                    alert("'Pull to One Side' is already enabled (either via this cheat or Chat QoL Auto-load)!");
                    return;
                }

                const TARGET = "拉到身边";

                if (!window._cheatMenuModApi && typeof window.bcModSdk !== "undefined") {
                    try {
                        window._cheatMenuModApi = window.bcModSdk.registerMod({
                            name: "BCDesktop_CheatMenu_EchoMouth",
                            fullName: "Cheat Menu - Echo Mouth",
                            version: "1.0.0",
                            repository: "https://github.com/Izumii99/BC-Desktop"
                        });
                    } catch (e) {
                        console.warn("Failed to register cheat menu with ModSDK:", e);
                    }
                }
                const modApi = window._cheatMenuModApi;

                const doActivityCheckPrerequisite = (args, next) => {
                    const prereq = args[0], acting = args[1], acted = args[2], group = args[3];
                    if (window._pullToSideActive) {
                        if (prereq === "UseHands")
                            return !acting.IsMouthBlocked() || next(args);
                        if (typeof prereq === 'string' && prereq.startsWith('Luzi_'))
                            return true;
                    }
                    return next(args);
                };

                const doActivityCheckPrerequisites = (args, next) => {
                    const activity = args[0], acting = args[1], acted = args[2], group = args[3];
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
                    return next(args);
                };

                const doServerSend = (args, next) => {
                    const Message = args[0], Data = args[1];
                    if (Message === "ChatRoomChat" && Data && Data.Type === "Activity" && Data.Dictionary) {
                        const isPullToSide = Data.Dictionary.some(d => 
                            d.ActivityName === TARGET || 
                            (d.Tag === "ActivityName" && typeof d.Text === 'string' && (d.Text === "Activity拉到身边" || d.Text === TARGET || d.Text.includes(TARGET)))
                        );

                        if (isPullToSide && typeof Player !== 'undefined' && !Player.CanInteract() && !Player.IsMouthBlocked()) {

                            let targetName = "them";
                            if (typeof CurrentCharacter !== 'undefined' && CurrentCharacter) {
                                targetName = CurrentCharacter.Name;
                            } else {
                                const otherEntry = Data.Dictionary.find(d => (d.TargetCharacter && d.TargetCharacter !== Player.MemberNumber) || (d.SourceCharacter && d.SourceCharacter !== Player.MemberNumber));
                                const otherId = otherEntry ? (otherEntry.TargetCharacter || otherEntry.SourceCharacter) : null;
                                if (otherId && typeof ChatRoomCharacter !== 'undefined') {
                                    const target = ChatRoomCharacter.find(c => c.MemberNumber === otherId);
                                    if (target) targetName = target.Name;
                                }
                            }

                            let pronoun = "her";
                            if (Player.Pronoun) {
                                const p = String(Player.Pronoun).toLowerCase();
                                if (p.includes("he") || p.includes("him")) pronoun = "his";
                                else if (p.includes("they") || p.includes("them")) pronoun = "their";
                            }
                            
                            setTimeout(() => {
                                if (typeof ServerSend === 'function') {

                                    const sender = window._origServerSend_EchoMouth || window.ServerSend;
                                    sender.call(window, "ChatRoomChat", {
                                        Content: `bites onto the leash and pulls ${targetName} with ${pronoun} mouth`,
                                        Type: "Emote",
                                        Dictionary: []
                                    });
                                }
                            }, 150);

                            if (typeof CharacterSetFacialExpression === 'function') {
                                CharacterSetFacialExpression(Player, "Mouth", "LipBite");
                                if (typeof CharacterRefresh === 'function') CharacterRefresh(Player);
                                if (typeof ChatRoomCharacterUpdate === 'function') ChatRoomCharacterUpdate(Player);
                            }
                        }
                    }
                    return next(args);
                };

                const doChatRoomCanBeLeashed = (args, next) => {
                    if (window._pullToSideActive) return true;
                    return next(args);
                };

                if (!window._echoMouthHooksApplied) {
                    window._echoMouthHooksApplied = true;
                    if (modApi) {
                        modApi.hookFunction("ActivityCheckPrerequisite", 0, doActivityCheckPrerequisite);
                        modApi.hookFunction("ActivityCheckPrerequisites", 0, doActivityCheckPrerequisites);
                        modApi.hookFunction("ServerSend", 0, doServerSend);
                        if (typeof ChatRoomCanBeLeashed === 'function') {
                            modApi.hookFunction("ChatRoomCanBeLeashed", 0, doChatRoomCanBeLeashed);
                        }
                    } else {

                        const origCheck = window.ActivityCheckPrerequisite;
                        window.ActivityCheckPrerequisite = function() { return doActivityCheckPrerequisite(arguments, origCheck.bind(this)); };
                        
                        const origChecks = window.ActivityCheckPrerequisites;
                        window.ActivityCheckPrerequisites = function() { return doActivityCheckPrerequisites(arguments, origChecks.bind(this)); };
                        
                        if (!window._origServerSend_EchoMouth) window._origServerSend_EchoMouth = window.ServerSend;
                        window.ServerSend = function() { return doServerSend(arguments, window._origServerSend_EchoMouth.bind(this)); };

                        if (typeof ChatRoomCanBeLeashed === 'function') {
                            const origLeash = window.ChatRoomCanBeLeashed;
                            window.ChatRoomCanBeLeashed = function() { return doChatRoomCanBeLeashed(arguments, origLeash.bind(this)); };
                        }
                    }
                }

                console.log("Cheat applied: Pull to One Side (mouth mode) enabled.");
                alert("'Pull to One Side' unlocked!\nHands tied? Uses mouth if free.\nAdds text suffix and LipBite expression when used.");
            }
        }
    ];

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

    cheats.sort((a, b) => a.name.localeCompare(b.name)).forEach(cheat => {
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

    // Only display the floating menu button on Login and InformationSheet (ESC menu), exactly like Chat QoL
    const BUTTON_SCREENS = ["Login", "InformationSheet"];

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

    const isMobileDevice = !!window.AndroidBridge || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

    if (isMobileDevice) {
        // Mobile / Android safety trigger: Double-tap & Hold (1st tap quick, 2nd tap held for ~400ms)
        let firstTapTime = 0;
        let firstTapX = 0, firstTapY = 0;
        let touchStartTime = 0;
        let touchStartX = 0, touchStartY = 0;
        let holdTimer = null;

        document.addEventListener("touchstart", (e) => {
            if (!isChatRoom() || isCheatUi(e.target)) return;
            if (e.touches.length !== 1) {
                clearTimeout(holdTimer);
                holdTimer = null;
                firstTapTime = 0;
                return;
            }

            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            touchStartTime = Date.now();

            const timeSinceFirstTap = touchStartTime - firstTapTime;
            const distFromFirstTap = Math.hypot(touchStartX - firstTapX, touchStartY - firstTapY);

            // Double tap detection: 2nd tap must occur within 450ms near 1st tap, then held for 400ms
            if (firstTapTime > 0 && timeSinceFirstTap <= 450 && distFromFirstTap < 45) {
                clearTimeout(holdTimer);
                holdTimer = setTimeout(() => {
                    openCheatMenu();
                    firstTapTime = 0;
                    holdTimer = null;
                }, 400);
            } else {
                firstTapTime = 0;
                clearTimeout(holdTimer);
                holdTimer = null;
            }
        }, { passive: false });

        document.addEventListener("touchmove", (e) => {
            if (e.touches.length > 0) {
                const dx = Math.abs(e.touches[0].clientX - touchStartX);
                const dy = Math.abs(e.touches[0].clientY - touchStartY);
                if (dx > 12 || dy > 12) {
                    clearTimeout(holdTimer);
                    holdTimer = null;
                    firstTapTime = 0;
                }
            }
        });

        document.addEventListener("touchend", () => {
            const touchDuration = Date.now() - touchStartTime;
            clearTimeout(holdTimer);
            holdTimer = null;

            if (touchDuration < 280 && firstTapTime === 0) {
                firstTapTime = Date.now();
                firstTapX = touchStartX;
                firstTapY = touchStartY;
                setTimeout(() => {
                    if (Date.now() - firstTapTime >= 450) {
                        firstTapTime = 0;
                    }
                }, 460);
            } else {
                firstTapTime = 0;
            }
        });
    } else {
        // Desktop / PC triggers: Right-Click or Mouse Long-Press Hold (600ms)
        let mouseHoldTimer = null;
        let mouseStartX = 0, mouseStartY = 0;

        function onChatRightClick(e) {
            if (!isChatRoom()) return;
            if (isCheatUi(e.target)) return;
            if (e.type !== "contextmenu" && e.button !== 2) return;
            e.preventDefault();
            e.stopPropagation();
            openCheatMenu();
        }

        document.addEventListener("mouseup", (e) => {
            if (mouseHoldTimer) {
                clearTimeout(mouseHoldTimer);
                mouseHoldTimer = null;
            }
            onChatRightClick(e);
        }, true);

        document.addEventListener("contextmenu", onChatRightClick, true);

        document.addEventListener("mousedown", (e) => {
            if (!isChatRoom() || isCheatUi(e.target)) return;
            if (e.button !== 0) return;
            mouseStartX = e.clientX;
            mouseStartY = e.clientY;
            clearTimeout(mouseHoldTimer);
            mouseHoldTimer = setTimeout(() => {
                openCheatMenu();
                mouseHoldTimer = null;
            }, 600);
        }, true);

        document.addEventListener("mousemove", (e) => {
            if (mouseHoldTimer) {
                const dx = Math.abs(e.clientX - mouseStartX);
                const dy = Math.abs(e.clientY - mouseStartY);
                if (dx > 10 || dy > 10) {
                    clearTimeout(mouseHoldTimer);
                    mouseHoldTimer = null;
                }
            }
        }, true);
    }

    setInterval(() => {
        try {
            if (window._bcIsBackground) return;
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

                if (!isChatRoom()) closeCheatMenu();
            }
        } catch (e) {}
    }, 2000);

    console.log("BC Desktop: Cheat Menu Addon loaded.");
})();
