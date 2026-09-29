(function () {
    'use strict';

    const TARGET_COLOR = "#547A82";

    function applyFluidsColor() {
        if (typeof Player !== 'undefined' && Player && Player.Appearance && Player.MemberNumber) {
            let fluidsItem = Player.Appearance.find(a => a.Asset && a.Asset.Group.Name === "Fluids");
            if (fluidsItem) {
                if (fluidsItem.Color !== TARGET_COLOR && fluidsItem.Color !== TARGET_COLOR.toLowerCase()) {
                    fluidsItem.Color = TARGET_COLOR;
                    
                    if (typeof CharacterRefresh === "function") {
                        CharacterRefresh(Player);
                    }
                    if (typeof ServerPlayerAppearanceSync === "function") {
                        ServerPlayerAppearanceSync();
                    }
                    console.log(`[FluidColor Addon] Fluids color updated to ${TARGET_COLOR}`);
                }
            }
        }
    }

    // Hook into LoginResponse to apply when the game loads
    let originalLoginResponse = window.LoginResponse;
    if (typeof originalLoginResponse === "function") {
        window.LoginResponse = function (...args) {
            originalLoginResponse(...args);
            setTimeout(applyFluidsColor, 2000); // Wait 2 seconds for assets to fully load
        };
    } else {
        // Fallback polling if LoginResponse isn't ready
        let initInterval = setInterval(() => {
            if (typeof Player !== 'undefined' && Player && Player.MemberNumber) {
                applyFluidsColor();
                clearInterval(initInterval);
            }
        }, 1000);
    }
    
    // Ensure the color is kept even if the user exits wardrobe
    let originalCharacterAppearanceReturnToPreviousScreen = window.CharacterAppearanceReturnToPreviousScreen;
    if (typeof originalCharacterAppearanceReturnToPreviousScreen === "function") {
        window.CharacterAppearanceReturnToPreviousScreen = function (...args) {
            applyFluidsColor();
            originalCharacterAppearanceReturnToPreviousScreen(...args);
        };
    }
})();
