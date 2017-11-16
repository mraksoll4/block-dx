import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/map';

import { Order } from './order';
// import { ORDERS } from './mock-orderbook';


@Injectable()
export class OrderbookService {
  public requestedOrder: Subject<Order> = new Subject();

  private orderbookUrl = '';
  // private orderbookUrl = 'https://api-public.sandbox.gdax.com/products/ETH-BTC/book?level=2';

  constructor(private http: Http) { }

  requestOrder(order: Order) {
    this.requestedOrder.next(order);
  }

  getOrderbook(symbols:string[]): Observable<Order> {
    this.orderbookUrl = 'api/orderbook_' + symbols.join("_");

    return this.http.get(this.orderbookUrl)
      .map((res) => {

        ////////////////////////////////////////////////////////////////////////
        // THIS IS NOT ELEGANT - FIX THIS!!! HAHA ~rsmith
        ////////////////////////////////////////////////////////////////////////

        const raw = res.json()[0];
        const p = Order.fromObject(raw);

        const asks = p.asks;
        const totalAskSize = asks.reduce((acc, curr) => {
          return acc + parseFloat(curr[1]);
        }, 0);

        asks.forEach((ask) => {
          ask.push((parseFloat(ask[1])/totalAskSize)*100);
          ask.push('ask');
        });

        ////////////////////////////////////////////////////////////////////////

        const bids = p.bids;
        const totalBidSize = asks.reduce((acc, curr) => {
          return acc + parseFloat(curr[1]);
        }, 0);

        bids.forEach((bid) => {
          bid.push((parseFloat(bid[1])/totalBidSize)*100);
          bid.push('bid');
        });

        ////////////////////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////////////////


        return p;
      });
    //  .toPromise()
    //  .then(response => response.json() as Order[])
    //  .catch(this.handleError);
  }

  // getOrderbook(): Observable<Order[]> {
  //   return this.http
  //     .get(this.orderbookUrl)
  //     .map((response) => response.json() as Order[]);
  // }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error); // for demo purposes only
    return Promise.reject(error.message || error);
  }
}
