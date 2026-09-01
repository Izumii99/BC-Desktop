(function () {
    "use strict";
    if (window !== window.top) return;

    let defaultIconStateApplied = false;

    setInterval(() => {
        try {
            if (typeof Player !== "undefined" && Player && Player.ImmersionSettings) {
                // Force ungarbled messages
                if (!Player.ImmersionSettings.ShowUngarbledMessages) {
                    Player.ImmersionSettings.ShowUngarbledMessages = true;
                    let cb = document.getElementById("preference-immersion-ShowUngarbledMessages");
                    if (cb && !cb.checked) {
                        cb.checked = true;
                    }
                }

                // Default Chat Room Icons to Squinted 1x (State 1) upon login
                if (!defaultIconStateApplied && typeof ChatRoomHideIconState !== "undefined") {
                    if (window.ChatRoomHideIconState === 0) {
                        window.ChatRoomHideIconState = 1;
                        defaultIconStateApplied = true;
                    }
                }
                
                if (typeof CurrentScreen !== "undefined" && CurrentScreen === "ChatRoom") {
                     if (!defaultIconStateApplied && typeof ChatRoomHideIconState !== "undefined") {
                         if (window.ChatRoomHideIconState === 0) {
                             window.ChatRoomHideIconState = 1;
                         }
                         defaultIconStateApplied = true;
                     }
                }
            }
        } catch (e) {}
    }, 2000);

    // Shift+Tab / Tab shortcut for LianChat navigation
    document.addEventListener("keydown", (e) => {
        let senderList = document.getElementById("LC-Message-SenderList");
        let isLianChatOpen = senderList && senderList.offsetParent !== null;

        if (e.key === "Tab") {
            e.preventDefault();

            if (isLianChatOpen) {
                // Filter only online friends (marked by strong class)
                let items = Array.from(senderList.querySelectorAll(".lc-conv-item")).filter(item => {
                    return item.offsetParent !== null && item.querySelector(".lc-conv-name--strong") !== null;
                });
                
                if (items.length > 0) {
                    let activeIndex = items.findIndex(item => 
                        item.classList.contains("is-active") || 
                        (item.style.backgroundColor && item.style.backgroundColor !== "transparent" && item.style.backgroundColor !== "")
                    );
                    
                    if (e.shiftKey) {
                        activeIndex = (activeIndex <= 0) ? items.length - 1 : activeIndex - 1;
                    } else {
                        activeIndex = (activeIndex === -1 || activeIndex === items.length - 1) ? 0 : activeIndex + 1;
                    }
                    
                    let targetItem = items[activeIndex];
                    if (targetItem) {
                        targetItem.scrollIntoView({ block: "nearest", behavior: "smooth" });
                        targetItem.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
                        targetItem.dispatchEvent(new MouseEvent("click", { bubbles: true }));
                    }
                }
            } else if (e.shiftKey) {
                // Open LianChat when closed
                let lianFab = document.getElementById("floatingMessageButton");
                if (lianFab) {
                    let targetBtn = lianFab.querySelector('.lc-theme-dial') || lianFab.querySelector("button") || lianFab;
                    let events = ["pointerdown", "mousedown", "pointerup", "mouseup", "click"];
                    events.forEach(type => {
                        targetBtn.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true }));
                    });
                }
            }
        }
    }, true);

    // Alt + Number (1-0) to whisper characters in room based on position
    document.addEventListener("keydown", (e) => {
        if (e.altKey && e.key >= '0' && e.key <= '9') {
            if (typeof window.ChatRoomCharacter !== "undefined" && Array.isArray(window.ChatRoomCharacter)) {
                let myNumber = (typeof Player !== "undefined" && Player.MemberNumber) ? Player.MemberNumber : -1;
                let otherChars = window.ChatRoomCharacter.filter(c => c.MemberNumber !== myNumber);
                
                let index = parseInt(e.key) - 1;
                if (e.key === '0') index = 9;
                
                if (index >= 0 && index < otherChars.length) {
                    let target = otherChars[index];
                    if (target && target.MemberNumber) {
                        e.preventDefault();
                        
                        // Toggle whisper target
                        if (window.ChatRoomTargetMemberNumber == target.MemberNumber) {
                            // Vanilla BC uses null, but BCX/ULTRAbc uses -1 for "Talk to everyone"
                            if (typeof window.BCX_Loaded !== "undefined" || window.ChatRoomTargetMemberNumber === -1) {
                                window.ChatRoomTargetMemberNumber = -1;
                            } else {
                                window.ChatRoomTargetMemberNumber = null;
                            }
                        } else {
                            window.ChatRoomTargetMemberNumber = target.MemberNumber;
                        }
                        
                        let chatInput = document.getElementById("InputChat");
                        if (chatInput) chatInput.focus();
                    }
                }
            }
        }
    }, true);
})();
