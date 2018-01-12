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
    w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    public style: object = { height: (this.h / 2) + 'px' };

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
        } else if (value == "\r\n") {
            return "\n"
        } else {
            return value;
        }
    }

    onKey($event: KeyboardEvent) {
        console.log('event -> '); console.log($event);
        let ch = this.convertToSingleChar($event)
        this.keySubject.next(ch);
    }

    convertToSingleChar(e: KeyboardEvent): string {
        let source = e.key;
        let lower = e.key.toLowerCase()
        let returnValue: string = '';
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
                if (e.type == 'compositionstart') {
                    returnValue = ' ';
                } else if (e.type == 'compositionupdate' && e.key.length == 1) {
                    returnValue += '\b';
                    returnValue += e.key;
                } else if (e.type == 'compositionend' && e.key.length == 1) {
                    if (e.key < '\u007f') { //ignore writing low unicode key in mobile. It should be written in textInput event
                        returnValue += '\b \b';
                    } else {
                        returnValue += '\b';
                        returnValue += e.key;
                    }
                } else {
                    if (source.length == 1)
                        returnValue = source;
                    else
                        returnValue = ''
                }
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
        this.style['position'] = 'fixed';
        this.style['left'] = `${event.rectangle.left}px`;
        this.style['top'] = `${event.rectangle.top}px`;
        this.style['width'] = `${event.rectangle.width}px`;
        this.style['height'] = `${event.rectangle.height}px`;
    }
}

interface InEvent {
    t: string
    m: string
}
