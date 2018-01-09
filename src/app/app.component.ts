import { Component } from '@angular/core';
import { environment } from '../environments/environment';
import { TerminalBuffer, keyMap } from 'ng-terminal';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
    title = 'app';
    ws: WebSocket;
    buffer: TerminalBuffer;

    onInit($event: TerminalBuffer) {
        this.buffer = $event;
        this.buffer.write(keyMap.Insert);
        this.ws = this.connect(environment.apiUrl);
        this.ws.onerror = (e) => console.log("err: " + JSON.stringify(e));
        this.ws.onclose = (e) => console.log("close: " + JSON.stringify(e));
        this.ws.onmessage = (e) => {
            console.log("msg: " + (e.data));
            let data: InEvent = JSON.parse(e.data);
            this.buffer.write(this.convertServerCharactersToClient(data.m));
        }
        this.ws.onopen = (e) => console.log("open: " + JSON.stringify(e))
    }

    convertServerCharactersToClient(value: string): string {
        if (value.indexOf("\b \b") != -1) {
            return value.replace(/[\b] [\b]/g, "\b");
        } else if (value.indexOf("\b") != -1) {
            return value.replace(/[\b]/g, keyMap.ArrowLeft)
        } else if (value == "\u0007") {
            return ""
        } else {
            return value;
        }
    }

    onKey($event: KeyboardEvent) {
        console.log('key:' + $event.key);
        let ch = this.convertToSingleChar($event)
        if (ch != undefined) {
            this.ws.send(JSON.stringify({ t: "i", "m": ch }))
        }
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
                returnValue = keyMap.Tab
                break;
            }
            case "space": {
                returnValue = " "
                break;
            }
            case "backspace": {
                returnValue = keyMap.BackSpace
                break;
            }
            case "arrowleft": {
                returnValue = keyMap.ArrowLeft
                break;
            }
            case "arrowright": {
                returnValue = keyMap.ArrowRight
                break;
            }
            case "arrowdown": {
                returnValue = keyMap.ArrowDown
                break;
            }
            case "arrowup": {
                returnValue = keyMap.ArrowUp
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
