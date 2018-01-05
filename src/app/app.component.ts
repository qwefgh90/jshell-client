import { Component } from '@angular/core';
import { Disposable } from 'ng-terminal';
import { environment } from '../environments/environment';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
    title = 'app';
    ws: WebSocket;

    onInit($event: Disposable) {
        this.ws = this.connect(environment.apiUrl);
        this.ws.onerror = (e) => console.log("err: " + JSON.stringify(e));
        this.ws.onclose = (e) => console.log("close: " + JSON.stringify(e));
        this.ws.onmessage = (e) => {
            console.log("msg: " + (e.data));
            let data: InEvent = JSON.parse(e.data)
            if (data.m == "\b \b")
                $event.handle((event, input) => {
                    return input.substring(0, input.length - 1);
                });
            else if (data.m == "\u0007") {

            } else
                $event.print(data.m);
        }
        this.ws.onopen = (e) => console.log("open: " + JSON.stringify(e))
    }
    onNext($event: Disposable) {
        let ch = this.convertToSingleChar($event.event)
        if (ch != undefined)
            this.ws.send(JSON.stringify({ t: "i", "m": ch }))
    }
    //https://www.novell.com/documentation/extend5/Docs/help/Composer/books/TelnetAppendixB.html
    convertToSingleChar(event: KeyboardEvent): string {
        let source = event.key;
        let lower = event.key.toLowerCase()
        let returnValue: string;
        switch (lower) {
            case "enter": {
                returnValue = "\n"
                break;
            }
            case "tab": {
                returnValue = "\t"
                break;
            }
            case "space": {
                returnValue = " "
                break;
            }
            case "backspace": {
                returnValue = "\b"
                break;
            }/*
            case "arrowleft": {
                returnValue = "\u001b[D"
                break;
            }
            case "arrowright": {
                returnValue = "\u001b[C"
                break;
            }*/
            case "arrowdown": {
                returnValue = "\u001b[B"
                break;
            }
            case "arrowup": {
                returnValue = "\u001b[A"
                break;
            }
            default: {
                if (source.length == 1)
                    returnValue = source;
                else
                    returnValue = undefined
            }
        }
        return returnValue;
    }
    connect(url): WebSocket {
        let ws = new WebSocket(url)
        return ws;
    }
}

interface InEvent {
    t: string
    m: string
}
