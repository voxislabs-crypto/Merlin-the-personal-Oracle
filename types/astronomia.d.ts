declare module 'astronomia' {
  export * from 'astronomia/src/julian';
  export * from 'astronomia/src/solar';
  export * from 'astronomia/src/planetposition';
  export * from 'astronomia/src/ayanamsha';
  export * from 'astronomia/src/moon';
  
  export namespace houses {
    class HouseSystem {
      constructor(jd: number, lat: number, lon: number, sys?: string);
      ascendant: number;
      house(houseNumber: number): number;
    }
  }
  
  export function house(jd: number, lat: number, lon: number, sys?: string): houses.HouseSystem;
}
