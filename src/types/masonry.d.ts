declare module 'masonry-layout' {
  interface MasonryOptions {
    itemSelector: string;
    columnWidth?: string | number;
    percentPosition?: boolean;
    gutter?: number;
    horizontalOrder?: boolean;
    fitWidth?: boolean;
    originLeft?: boolean;
    originTop?: boolean;
    initLayout?: boolean;
    transitionDuration?: number | string;
    stagger?: number | string;
    resize?: boolean;
  }

  class Masonry {
    constructor(element: Element | string, options?: MasonryOptions);
    layout(): void;
    reloadItems(): void;
    destroy(): void;
    getItemElements(): Element[];
    remove(elements: Element | Element[] | NodeList): void;
    appended(elements: Element | Element[] | NodeList): void;
    prepended(elements: Element | Element[] | NodeList): void;
  }

  export default Masonry;
}

declare module 'imagesloaded' {
  interface ImagesLoadedOptions {
    background?: boolean | string;
  }

  interface ImagesLoadedInstance {
    images: any[];
    elements: Element[];
    on(event: string, listener: Function): ImagesLoadedInstance;
    off(event: string, listener: Function): ImagesLoadedInstance;
    once(event: string, listener: Function): ImagesLoadedInstance;
  }

  interface ImagesLoadedStatic {
    (elem: Element | string | NodeList | HTMLCollection, options?: ImagesLoadedOptions, callback?: Function): ImagesLoadedInstance;
    new (elem: Element | string | NodeList | HTMLCollection, options?: ImagesLoadedOptions, callback?: Function): ImagesLoadedInstance;
  }

  const imagesLoaded: ImagesLoadedStatic;
  export default imagesLoaded;
} 