(function() {
    "use strict";
    if (window._nekoAppearancePaginator) return;
    window._nekoAppearancePaginator = true;

    let currentPage = 0;
    const itemsPerPage = 30; // 3 cols x 10 rows

    // Wait for game rendering functions
    let initInterval = setInterval(() => {
        if (typeof window.DrawButton === "function" && typeof window.MouseIn === "function") {
            clearInterval(initInterval);
            initPaginator();
        }
    }, 500);

    function initPaginator() {
        // Store original functions
        const origDrawButton = window.DrawButton;
        const origMouseIn = window.MouseIn;
        const origDrawEmptyRect = window.DrawEmptyRect;
        const origDrawRect = window.DrawRect;

        let maxItemIndex = 0;
        let currentFrameMax = 0;

        // Calculate visual grid coordinates
        function getVisualCoords(Left, Top, Width, Height) {
            // Target wardrobe item buttons based on dimensions and position
            if (window.CurrentScreen === "Appearance" && Width >= 200 && Width <= 300 && Height >= 40 && Height <= 70 && Left >= 950 && Top >= 200) {
                
                let CenterX = Left + (Width / 2);
                let CenterY = Top + (Height / 2);
                
                let colFloat = (CenterX - 1138.5) / 281;
                let rowFloat = (CenterY - 267) / 69;
                
                if (Math.abs(colFloat - Math.round(colFloat)) < 0.25 && Math.abs(rowFloat - Math.round(rowFloat)) < 0.25) {
                    let col = Math.round(colFloat);
                    let row = Math.round(rowFloat);
                    
                    let originalIndex = col * 10 + row; 
                    
                    // Hide items outside current page
                    if (originalIndex < currentPage * itemsPerPage || originalIndex >= (currentPage + 1) * itemsPerPage) {
                        return { Left, Top, Valid: false, index: originalIndex };
                    }

                    // Shift position to match target grid
                    let visualIndex = originalIndex % itemsPerPage;
                    let visualCol = Math.floor(visualIndex / 10);
                    let visualRow = visualIndex % 10;
                    
                    let expectedGridLeft = 1006 + (col * 281);
                    let expectedGridTop = 240 + (row * 69);
                    let visualGridLeft = 1006 + (visualCol * 281);
                    let visualGridTop = 240 + (visualRow * 69);
                    
                    let newLeft = Left + (visualGridLeft - expectedGridLeft);
                    let newTop = Top + (visualGridTop - expectedGridTop);
                    
                    return { Left: newLeft, Top: newTop, Valid: true, index: originalIndex };
                }
            }
            return { Left, Top, Valid: true, index: -1 }; 
        }

        // Intercept DrawButton
        window.DrawButton = function(Left, Top, Width, Height, Label, Color, Image, HoveringText, Disabled) {
            if (window.CurrentScreen === "Appearance" && Label === "<<< Back") {
                if (currentFrameMax > 0) maxItemIndex = currentFrameMax;
                currentFrameMax = 0;
                
                let totalPages = Math.max(1, Math.ceil((maxItemIndex + 1) / itemsPerPage));
                if (currentPage >= totalPages) currentPage = Math.max(0, totalPages - 1); 

                let ret = origDrawButton(Left, Top, Width, Height, Label, Color, Image, HoveringText, Disabled);
                
                // Draw pagination controls
                origDrawButton(1600, 173, 100, 48, "< Prev", currentPage > 0 ? "White" : "#888");
                origDrawButton(1720, 173, 100, 48, `Page ${currentPage + 1}/${totalPages}`, "White");
                origDrawButton(1840, 173, 100, 48, "Next >", currentPage < totalPages - 1 ? "White" : "#888");
                
                return ret;
            }

            let v = getVisualCoords(Left, Top, Width, Height);
            if (v.index > currentFrameMax) currentFrameMax = v.index; 

            if (!v.Valid) return;
            return origDrawButton(v.Left, v.Top, Width, Height, Label, Color, Image, HoveringText, Disabled);
        };

        if (origDrawEmptyRect) {
            window.DrawEmptyRect = function(Left, Top, Width, Height, Color, Thickness) {
                let v = getVisualCoords(Left, Top, Width, Height);
                if (!v.Valid) return;
                return origDrawEmptyRect(v.Left, v.Top, Width, Height, Color, Thickness);
            };
        }

        if (origDrawRect) {
            window.DrawRect = function(Left, Top, Width, Height, Color) {
                let v = getVisualCoords(Left, Top, Width, Height);
                if (!v.Valid) return;
                return origDrawRect(v.Left, v.Top, Width, Height, Color);
            };
        }

        // Intercept MouseIn
        window.MouseIn = function(Left, Top, Width, Height) {
            let v = getVisualCoords(Left, Top, Width, Height);
            if (!v.Valid) return false;
            
            if (v.Left !== Left || v.Top !== Top) {
                return (window.MouseX >= v.Left) && (window.MouseX <= v.Left + Width) && 
                       (window.MouseY >= v.Top)  && (window.MouseY <= v.Top + Height);
            }
            return origMouseIn(Left, Top, Width, Height);
        };

        // Handle clicks for pagination
        window.addEventListener("mousedown", (e) => {
            if (window.CurrentScreen === "Appearance") {
                let totalPages = Math.max(1, Math.ceil((maxItemIndex + 1) / itemsPerPage));
                
                if (origMouseIn(1600, 173, 100, 48) && currentPage > 0) {
                    currentPage--;
                    e.stopImmediatePropagation();
                }
                else if (origMouseIn(1840, 173, 100, 48) && currentPage < totalPages - 1) {
                    currentPage++; 
                    e.stopImmediatePropagation();
                }
                else if (window.MouseX < 1000 || origMouseIn(1020, 173, 200, 48)) {
                    currentPage = 0; // Reset page on category change
                }
            }
        }, true);
    }
})();
