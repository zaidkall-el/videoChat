import { Injectable } from '@angular/core';

import {WebSocketSubject} from "rxjs/internal-compatibility";
import {Subject} from "rxjs";
import {webSocket} from "rxjs/webSocket";
import {environment} from "../../environments/environment";
import {HttpClient, HttpHeaders} from "@angular/common/http";
export const WS_ENDPOINT = environment.wsEndpoint;
var ROOT = 'http://192.168.1.103:8000'
export interface Message {
  types: string;
  message: any;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  token='eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNjQ0NzYyNzIzLCJqdGkiOiI4ZTYyMDNlOWJjNGU0ZTc1YjI0YWY3NDVmYWYwYjcyMSIsInVzZXJfaWQiOjR9.HIMXZLeuFgQxCzwMMX76wxTdwUIkjp_JADNsfXWjp34'
  socket!: WebSocketSubject<any>;
  messagesSubject = new Subject<Message>();
  messages = this.messagesSubject.asObservable();

  constructor( private http:HttpClient) { }

  public connect(): void {

      this.socket = this.getNewWebSocket();

      this.socket.subscribe(
        // Called whenever there is a message from the server
        msg => {
          console.log('Received message of type: ' + msg.types);
          this.messagesSubject.next(msg);
        }
      );

  }
  getNewWebSocket(): WebSocketSubject<any> {
    return webSocket({
      url: WS_ENDPOINT,
      openObserver: {
        next: () => {
          console.log('[DataService]: connection ok');
        }
      },
      closeObserver: {
        next: () => {
          console.log('[DataService]: connection closed');
          this.socket = undefined as any
          this.connect();
        }
      }
    });
  }
  sendOfferAndResponceRTCConnection(types:any,data:any,conversation_id:any){
    return this.http.post(ROOT+'/webrtcOffer/',{
      data:data,
      types:types,
      conversation_id:conversation_id
    },{headers: new HttpHeaders({
        'Authorization': 'Bearer ' + this.token,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      })})
  }
}
