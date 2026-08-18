declare module "jsbarcode" {
  interface JsBarcodeOptions {
    format?: string;
    width?: number;
    height?: number;
    displayValue?: boolean;
    fontSize?: number;
    margin?: number;
    background?: string;
    lineColor?: string;
    textAlign?: string;
    textPosition?: string;
    textMargin?: number;
    font?: string;
  }

  function JsBarcode(
    element: SVGElement | HTMLCanvasElement | HTMLImageElement | string | null,
    value: string,
    options?: JsBarcodeOptions,
  ): void;

  export default JsBarcode;
}
