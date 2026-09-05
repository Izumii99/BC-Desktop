// ==UserScript==
// @name         BC Cheat Menu
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Right-click context menu for rare cheats
// @author       Izumii99
// @match        https://*.bondageprojects.elementfx.com/*
// @match        https://*.bondage-europe.com/*
// @match        https://*.bondageprojects.com/*
// @match        https://*.bondage-asia.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
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
            name: "Max Love for Private NPCs",
            desc: "Makes all custom NPCs in your private room love you instantly.",
            action: () => {
                if (typeof Character !== 'undefined' && typeof NPCLoveChange !== 'undefined') {
                    Character.filter(c => c.AccountName.startsWith('NPC_Private_Custom')).forEach(c => NPCLoveChange(c, 200));
                    console.log("Cheat applied: NPC Love maxed.");
                    alert("All private room NPCs now love you!");
                }
            }
        },
        {
            name: "Max Traits for Private NPCs",
            desc: "Caps all private NPCs to their max traits (positive or negative).",
            action: () => {
                if (typeof Character !== 'undefined' && typeof NPCTrait !== 'undefined' && typeof NPCTraitGet !== 'undefined') {
                    Character.filter(c => c.AccountName.startsWith('NPC_Private_Custom'))
                        .forEach(c => NPCTrait.forEach(t => {
                            let val = NPCTraitGet(c, t[0]);
                            if (val > 0) NPCTraitSet(c, t[0], 100);
                            else if (val < 0) NPCTraitSet(c, t[0], -100);
                        }));
                    console.log("Cheat applied: NPC Traits maxed.");
                    alert("All private room NPCs traits have been maxed!");
                }
            }
        }
    ];

    // Create the menu DOM elements once
    const menu = document.createElement("div");
    Object.assign(menu.style, {
        position: "fixed",
        backgroundColor: "#1a1625",
        border: "1px solid #3d3554",
        borderRadius: "8px",
        padding: "5px 0",
        minWidth: "250px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
        zIndex: "9999999",
        display: "none",
        color: "#f5f5f5",
        fontFamily: "'Inter', Arial, sans-serif",
        fontSize: "14px"
    });

    const header = document.createElement("div");
    header.innerText = "BC Cheat Menu";
    Object.assign(header.style, {
        padding: "8px 15px",
        fontWeight: "bold",
        borderBottom: "1px solid #2e2640",
        marginBottom: "5px",
        color: "#a59fb5"
    });
    menu.appendChild(header);

    cheats.forEach(cheat => {
        const item = document.createElement("div");
        item.innerText = cheat.name;
        item.title = cheat.desc;
        Object.assign(item.style, {
            padding: "8px 15px",
            cursor: "pointer",
            transition: "background-color 0.2s"
        });
        item.onmouseenter = () => item.style.backgroundColor = "#3d3554";
        item.onmouseleave = () => item.style.backgroundColor = "transparent";
        item.onclick = () => {
            cheat.action();
            menu.style.display = "none";
        };
        menu.appendChild(item);
    });

    document.body.appendChild(menu);

    // Keyboard shortcut event (Alt + P)
    document.addEventListener("keydown", (e) => {
        if (e.altKey && !e.shiftKey && !e.ctrlKey && e.code === 'KeyP') {
            e.preventDefault();
            e.stopPropagation();
            
            if (menu.style.display === "block") {
                menu.style.display = "none";
            } else {
                menu.style.display = "block";
                // Center the menu on the screen
                menu.style.left = (window.innerWidth / 2 - 125) + "px"; // minWidth is 250px
                menu.style.top = (window.innerHeight / 2 - 150) + "px";
            }
        }
    }, true);

    // Floating Button Fallback
    const floatingBtn = document.createElement("div");
    floatingBtn.innerText = "🔮";
    floatingBtn.title = "Cheat Menu";
    Object.assign(floatingBtn.style, {
        position: "fixed",
        top: "20px",
        left: "20px",
        width: "40px",
        height: "40px",
        backgroundColor: "#2e2742",
        color: "white",
        borderRadius: "50%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "20px",
        cursor: "pointer",
        boxShadow: "0 4px 10px rgba(0,0,0,0.5)",
        zIndex: "9999998",
        transition: "transform 0.2s, background-color 0.2s",
        userSelect: "none",
        border: "2px solid #3d3554"
    });

    floatingBtn.onmouseenter = () => {
        floatingBtn.style.backgroundColor = "#3d3554";
        floatingBtn.style.transform = "scale(1.1)";
    };
    floatingBtn.onmouseleave = () => {
        floatingBtn.style.backgroundColor = "#2e2742";
        floatingBtn.style.transform = "scale(1)";
    };
    floatingBtn.onclick = (e) => {
        e.stopPropagation();
        if (menu.style.display === "block") {
            menu.style.display = "none";
        } else {
            menu.style.display = "block";
            const btnRect = floatingBtn.getBoundingClientRect();
            menu.style.left = (btnRect.right + 10) + "px";
            menu.style.top = btnRect.top + "px";
        }
    };
    document.body.appendChild(floatingBtn);

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
        if (menu.style.display === "block" && !menu.contains(e.target) && e.target !== floatingBtn) {
            menu.style.display = "none";
        }
    }, { capture: true });

    console.log("BC Desktop: Cheat Menu Addon loaded. Press Alt + P to use.");
})();
