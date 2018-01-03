import { Component } from '@angular/core';
import { Disposable } from 'ng-terminal';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
    title = 'app';
    onInit($event: Disposable) {
        $event.print("hello")
    }
    onNext($event: Disposable) {
        console.log($event.toString())
    }
}
