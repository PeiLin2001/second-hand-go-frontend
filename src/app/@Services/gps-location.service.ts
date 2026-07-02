import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import * as turf from '@turf/turf';


@Injectable({
  providedIn: 'root'
})

export class GPSLocationService {

  baseUrl = '/api.opencube.tw/location';
  constructor(private http: HttpClient) { }

  getData(): Observable<any> {
      return this.http.get(
        this.baseUrl
      );
  }

  getCityName(lat: number, lng: number): Observable<string> {
    return this.http.get<any>('twCounty2010.geo.json').pipe(
      map(geoJson => {
        const point = turf.point([lng, lat]); // turf 座標順序是 [lng, lat]

        const found = geoJson.features.find((feature: any) =>
          turf.booleanPointInPolygon(point, feature)
        );

        return found?.properties?.COUNTYNAME ?? '找不到縣市';
      })
    );
  }
}
