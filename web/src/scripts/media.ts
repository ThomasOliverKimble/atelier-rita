// "Mobile" behaviour switch, same as the old useDeviceDetect (width <= 1080px
// or a touch device), as one shared MediaQueryList instead of a resize
// listener per component.
export const isMobile = matchMedia("(max-width: 1080px), (hover: none) and (pointer: coarse)");
