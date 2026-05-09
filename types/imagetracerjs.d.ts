declare module "imagetracerjs" {
  interface Options {
    ltres?: number;
    qtres?: number;
    pathomit?: number;
    rightangleenhance?: boolean;
    colorsampling?: number;
    numberofcolors?: number;
    mincolorratio?: number;
    colorquantcycles?: number;
    layering?: number;
    strokewidth?: number;
    linefilter?: boolean;
    scale?: number;
    roundcoords?: number;
    viewbox?: boolean;
    desc?: boolean;
    lcpr?: number;
    qcpr?: number;
    blurradius?: number;
    blurdelta?: number;
  }

  export function imageToSVG(
    url: string,
    callback: (svgString: string) => void,
    options?: Options,
  ): void;

  export function imageDataToSVG(
    imgd: ImageData,
    callback: (svgString: string) => void,
    options?: Options,
  ): void;
}
