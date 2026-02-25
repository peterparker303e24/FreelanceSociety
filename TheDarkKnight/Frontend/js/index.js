
// Scroll through home page buttons
window.onload = function () {
    const scrollableContainer = document.querySelector('.scrollable-container');
    const scrollableArea = document.querySelector('.scrollable-area');
    const centerX = (
        scrollableArea.scrollWidth - scrollableContainer.clientWidth
    ) / 2;
    const centerY = (
        scrollableArea.scrollHeight - scrollableContainer.clientHeight
    ) / 2;
    scrollableContainer.scrollLeft = centerX;
    scrollableContainer.scrollTop = centerY;
};
