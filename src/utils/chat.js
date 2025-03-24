import Tooltip from "tooltip.js";

/**
 * 提示
 * @param element
 * @param message 提示消息
 */
export function createTooltip(element, message) {
    const tooltip = new Tooltip(element, {
        title: message,
        placement: "top",
        trigger: "hover",
    });
}