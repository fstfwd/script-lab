import { Component, OnInit, ApplicationRef } from '@angular/core';
import { Storage } from '@microsoft/office-js-helpers';
import { SnippetStore, Snippet, Notification, Events, GalleryEvents } from '../shared/services';
import { ViewBase } from '../shared/components/base';
import * as _ from 'lodash';
import './gallery.view.scss';

@Component({
    selector: 'gallery-view',
    templateUrl: 'gallery.view.html'
})
export class GalleryView extends ViewBase implements OnInit {
    snippets: ISnippet[] = [];
    templates: IPlaylist = {} as any;
    hideWarn: boolean;
    private _store: Storage<string>;

    constructor(
        private _appRef: ApplicationRef,
        private _snippetStore: SnippetStore,
        private _notification: Notification,
        private _events: Events
    ) {
        super();
        this._store = new Storage<string>('Playground');
        this.hideWarn = this._store.get('LocalStorageWarn') as any || false;
    }

    ngOnInit() {
        this.snippets = this._snippetStore.local();
        this._snippetStore.templates().then(templates => this.templates = templates);
        // let subscription = this._notification.on<ISnippet>('StorageEvent')
        //     .throttleTime(100)
        //     .subscribe(items => {
        //         this.snippets = this._snippetStore.local();
        //     });

        // this.markDispose(subscription);
    }

    delete(snippet: ISnippet) {
        return this._notification.showDialog('Are you sure you want to delete your snippet?', `Delete '${snippet.name}'`, 'Delete', 'Keep')
            .then(result => {
                if (result === 'Keep') {
                    throw 'Keep data';
                }
                if (this._store.get('LastOpened') === snippet.id) {
                    return this._store.remove('LastOpened');
                }
            })
            .then(() => this._snippetStore.delete(snippet))
            .then(() => this._events.emit('GalleryEvents', GalleryEvents.DELETE, snippet))
            .catch(() => { });
    }

    deleteAll() {
        return this._notification.showDialog('Are you sure you want to delete all your local snippets?', 'Delete All', 'Delete all', 'Keep them')
            .then(result => {
                if (result === 'Keep them') {
                    return;
                }

                return this._snippetStore.clear();
            })
            .then(() => this._store.remove('LastOpened'))
            .then(() => this._events.emit('GalleryEvents', GalleryEvents.DELETE_ALL, null));
    }

    toggleWarn() {
        this.hideWarn = !this.hideWarn;
        this._store.insert('LocalStorageWarn', this.hideWarn as any);
    }

    new() {
        this._events.emit('GalleryEvents', GalleryEvents.CREATE, null);
    }

    copy(snippet: ISnippet) {
        this._events.emit('GalleryEvents', GalleryEvents.COPY, snippet);
    }

    select(snippet: ISnippet) {
        this._events.emit('GalleryEvents', GalleryEvents.SELECT, snippet);
    }

    commandEvents($event: any) {
        if ($event.title === 'Local') {
            switch ($event.action) {
                case 'Info': return Promise.resolve(this.toggleWarn());
                case 'Delete': return this.deleteAll();
            }
        }
    }
}
