import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { NgTerminalModule } from 'ng-terminal';
import { ResizableModule } from 'angular-resizable-element';
import { AppComponent } from './app.component';


@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        BrowserModule,
        NgTerminalModule,
        ResizableModule
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }
