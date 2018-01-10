import { Component, OnDestroy } from '@angular/core';
import { environment } from '../environments/environment';
import { TerminalBuffer, keyMap } from 'ng-terminal';
import * as Rx from 'rxjs/Rx';
import { ResizeEvent } from 'angular-resizable-element';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnDestroy {
    title = 'app';
    ws: WebSocket;
    buffer: TerminalBuffer;
    running = false;

    keySubject = new Rx.Subject<string>();
    keyInterval = 100; //millisecond
    public style: object = {};

    onInit($event: TerminalBuffer) {
        this.buffer = $event;
        this.buffer.write(keyMap.Insert);
        this.runSocket();
        this.keySubject
            .zip(Rx.Observable.interval(this.keyInterval), function(a, b) { return a; })
            .subscribe((ch) => {
                if (!this.running && ch == "\n") {
                    this.runSocket();
                } else if (this.running && ch != undefined) {
                    this.ws.send(JSON.stringify({ t: "i", "m": ch }))
                }
                return ch;
            });
    }

    ngOnDestroy() {
        this.ws.close();
    }

    runSocket() {
        if (this.running == false) {
            this.ws = new WebSocket(environment.apiUrl);
            this.ws.onerror = (e) => {
                console.log("onerr: " + JSON.stringify(e));
                this.running = false;
            };
            this.ws.onclose = (e) => {
                console.log("onclose: " + JSON.stringify(e));
                this.running = false;
                this.buffer.write("\nPlease enter to restart JShell.\n\n");
            };
            this.ws.onmessage = (e) => {
                console.log("onmsg: " + (e.data));
                let data: InEvent = JSON.parse(e.data);
                this.buffer.write(this.convertServerCharactersToClient(data.m));
            }
            this.ws.onopen = (e) => {
                console.log("onopen: " + JSON.stringify(e));
                this.running = true;

            };
        }
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
        this.keySubject.next(ch);
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
            case "home": {
                returnValue = keyMap.KeyHome
                break;
            }
            case "end": {
                returnValue = keyMap.KeyEnd
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

    validate(event: ResizeEvent): boolean {
        const MIN_DIMENSIONS_PX: number = 200;
        if (
            event.rectangle.width &&
            event.rectangle.height &&
            (event.rectangle.width < MIN_DIMENSIONS_PX ||
                event.rectangle.height < MIN_DIMENSIONS_PX)
        ) {
            return false;
        }
        return true;
    }

    onResizeEnd(event: ResizeEvent): void {
        this.style = {
            position: 'fixed',
            left: `${event.rectangle.left}px`,
            top: `${event.rectangle.top}px`,
            width: `${event.rectangle.width}px`,
            height: `${event.rectangle.height}px`
        };
    }
}

interface InEvent {
    t: string
    m: string
}
