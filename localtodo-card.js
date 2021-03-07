import {LitElement, html, css} from 'https://unpkg.com/lit-element@2.4.0/lit-element.js?module';

class TodoistCardEditor extends LitElement {
    static get properties() {
        return {
            hass: Object,
            _config: Object,
        };
    }
    
    get _entity() {
        if (this._config) {
            return this._config.entity || '';
        }
        
        return '';
    }

    get _cardName() {
        if (this._config) {
            return this._config.name || '';
        }
        
        return '';
    }
    
    get _show_header() {
        if (this._config) {
            return this._config.show_header || true;
        }
        
        return true;
    }

    get _show_item_add() {
        if (this._config) {
            return this._config.show_item_add || true;
        }
        
        return true;
    }

    get _show_item_close() {
        if (this._config) {
            return this._config.show_item_close || true;
        }
        
        return true;
    }

    get _show_item_delete() {
        if (this._config) {
            return this._config.show_item_delete || true;
        }
        
        return true;
    }

    get _show_item_edit() {
        if (this._config) {
            return this._config.show_item_edit|| true;
        }
        
        return true;
    }

    get _only_today_overdue() {
        if (this._config) {
            return this._config.only_today_overdue || false;
        }
        
        return false;
    }
    
    setConfig(config) {
        this._config = config;
    }
    
    configChanged(config) {
        const e = new Event('config-changed', {
            bubbles: true,
            composed: true,
        });
        
        e.detail = {config: config};
        
        this.dispatchEvent(e);
    }
    
    getEntitiesByType(type) {
        return this.hass
            ? Object.keys(this.hass.states).filter(entity => entity.substr(0, entity.indexOf('.')) === type)
            : [];
    }
    
    valueChanged(e) {
        if (
            !this._config
            || !this.hass
            || (this[`_${e.target.configValue}`] === e.target.value)
        ) {
            return;
        }
        
        if (e.target.configValue) {
            if (e.target.value === '') 
            {
                if (e.target.configValue !== 'entity' && e.target.configValue !== 'name') {
                    delete this._config[e.target.configValue];
                }
                else
                {
                     this._config = {
                    ...this._config,
                    [e.target.configValue]: e.target.checked !== undefined
                        ? e.target.checked
                        : e.target.value,
                    };
                }
            }
            else 
            {
                this._config = {
                    ...this._config,
                    [e.target.configValue]: e.target.checked !== undefined
                        ? e.target.checked
                        : e.target.value,
                };
            }
        }
        
        this.configChanged(this._config);
    }
    
    render() {
        if (!this.hass) {
            return html``;
        }
        
        const entities = this.getEntitiesByType('sensor');

        return html`<div class="card-config">
            <paper-dropdown-menu
                label="Entity (required)"
                .configValue=${'entity'}
                @value-changed=${this.valueChanged}
            >
                <paper-listbox
                    slot="dropdown-content"
                    .selected=${entities.indexOf(this._config.entity || '')}
                >
                    ${entities.map(entity => {
                        return html`<paper-item>${entity}</paper-item>`;
                    })}
                </paper-listbox>
            </paper-dropdown-menu>
            
            <paper-input
                label="Card name"
                .value=${(this._config.name)}
                .configValue=${'name'}
                @value-changed=${this.valueChanged}
            >
            </paper-input>

            <p class="option">
                <ha-switch
                    .checked=${(this._config.show_header === undefined) || (this._config.show_header !== false)}
                    .configValue=${'show_header'}
                    @change=${this.valueChanged}
                >
                </ha-switch>
                Show header
            </p>

            <p class="option">
                <ha-switch
                    .checked=${(this._config.show_item_add === undefined) || (this._config.show_item_add !== false)}
                    .configValue=${'show_item_add'}
                    @change=${this.valueChanged}
                >
                </ha-switch>
                Show text input element for adding new items to the list
            </p>

            <p class="option">
                <ha-switch
                    .checked=${(this._config.show_item_close === undefined) || (this._config.show_item_close !== false)}
                    .configValue=${'show_item_close'}
                    @change=${this.valueChanged}
                >
                </ha-switch>
                Show "close/complete" buttons
            </p>

            <p class="option">
                <ha-switch
                    .checked=${(this._config.show_item_delete === undefined) || (this._config.show_item_delete !== false)}
                    .configValue=${'show_item_delete'}
                    @change=${this.valueChanged}
                >
                </ha-switch>
                Show "delete" buttons
            </p>

            <p class="option">
            <ha-switch
                .checked=${(this._config.show_item_edit === undefined) || (this._config.show_item_edit !== false)}
                .configValue=${'show_item_edit'}
                @change=${this.valueChanged}
            >
            </ha-switch>
            Show "edit" buttons
        </p>

            <p class="option">
                <ha-switch
                    .checked=${(this._config.only_today_overdue !== undefined) && (this._config.only_today_overdue !== false)}
                    .configValue=${'only_today_overdue'}
                    @change=${this.valueChanged}
                >
                </ha-switch>
                Only show today or overdue
            </p>
        </div>`;
    }
    
    static get styles() {
        return css`
            .card-config paper-dropdown-menu {
                width: 100%;
            }
            
            .option {
                display: flex;
                align-items: center;
            }
            
            .option ha-switch {
                margin-right: 10px;
            }
        `;
    }
}


class TodoistCard extends LitElement {
    static get properties() {
        return {
            hass: Object,
            config: Object,
            isUpdate: Object,
            updateId: Object,
            lastPerson: Object,
        };
    }
    
    static getConfigElement() {
        return document.createElement('localtodo-card-editor');
    }

    setConfig(config) {
        if (!config.entity) {
            throw new Error('Entity is not set!');
        }
        
        this.config = config;
    }

    getCardSize() {
        return this.hass ? (this.hass.states[this.config.entity].attributes.items.length || 1) : 1;
    }
    
    random(min, max) {
        return Math.floor(Math.random() * (max - min) + min);
    }
    
    itemAddorUpdate(e) {
        if (e.which === 13 || e.which === 1) {
            let input = this.shadowRoot.getElementById('todoist-card-item-add');
            let value = input.value;

            let inputPerson = this.shadowRoot.getElementById('todoist-card-item-addResponsePerson');
            let valuePerson = inputPerson.value;

            if (value && value.length > 1) {
                let stateValue = this.hass.states[this.config.entity].state || undefined;
        
                if (stateValue) {
                    let date = new Date();
                    let temp
                    let type
                    if (this.isUpdate)
                    {
                        type = 'item_update'
                        temp = this.updateId
                    }
                    else
                    {
                        type = 'item_add'
                        temp = this.random(1, 100) + '-' + (+date) + '-' + date.getMilliseconds();
                    }
                    
                    let commands = [{
                        'type': type,
                        'temp_id': temp,
                        'args': {
                            'content': value,
                            'responsePerson': valuePerson,
                        },
                    }];
                    
                    this.hass.callService('rest_command', 'todoist', {
                        commands: JSON.stringify(commands),
                    });

                    let t = this;
                    setTimeout(function () {
                        t.hass.callService('homeassistant', 'update_entity', {
                            entity_id: t.config.entity,
                        });
                    }, 1000);
                    
                    this.isUpdate = false;
                    setTimeout(() => {  
                        input.value = '';
                        inputPerson.value = '';
                    }, 500);
                }
            }
        }
    }

    itemEdit(itemId, itemContent, itemResponsePerson) {
        this.isUpdate = true;
        this.updateId = itemId;
        this.lastPerson = itemResponsePerson;
        
        let input = this.shadowRoot.getElementById('todoist-card-item-add');
        input.value = itemContent;
        
        let inputPerson = this.shadowRoot.getElementById('todoist-card-item-addResponsePerson');
        inputPerson.value = itemResponsePerson;

        let t = this;
        setTimeout(function () {
            t.hass.callService('homeassistant', 'update_entity', {
                entity_id: t.config.entity,
            });
        }, 1000);
    }
    
    itemClose(itemId) {
        let date = new Date();
        
        let commands = [{
            'type': 'item_close',
            'args': {
                'id': itemId,
            },
        }];
        
        this.hass.callService('rest_command', 'todoist', {
            commands: JSON.stringify(commands),
        });
        
        let t = this;
        setTimeout(function () {
            t.hass.callService('homeassistant', 'update_entity', {
                entity_id: t.config.entity,
            });
        }, 1000);
    }
    
    itemDelete(itemId) {
        let date = new Date();
        
        let commands = [{
            'type': 'item_delete',
            'args': {
                'id': itemId,
            },
        }];
        
        this.hass.callService('rest_command', 'todoist', {
            commands: JSON.stringify(commands),
        });
        
        let t = this;
        setTimeout(function () {
            t.hass.callService('homeassistant', 'update_entity', {
                entity_id: t.config.entity,
            });
        }, 1000);
    }

    setEnterKey (e)
    {
        let inputPerson = this.shadowRoot.getElementById('todoist-card-item-addResponsePerson');
        let valuePerson = inputPerson.value;

        if (!this.isUpdate || this.lastPerson != valuePerson)
        {
            e["which"] = 13;
            this.itemAddorUpdate(e)
        }
    } 

    render() {
        let state = this.hass.states[this.config.entity] || undefined;
        
        if (!state) {
            return html``;
        }
        
        let items = state.attributes.items || [];
        if (this.config.only_today_overdue) {
            items = items.filter(item => {
                return item.due && (+(new Date()) >= +(new Date(item.due.date))); // TODO: handle item.due.timezone
            });
        }

        try
        {
            var language = state.attributes.settings.language || [];
        }
        catch
        {
            throw new Error('List sensor not reachable!');
        }

        var language = state.attributes.settings.language || [];
        var openJobs
        var newTask
        var newResponsePerson

        if (language == "de")
        {
            openJobs = "Keine offenen Aufgaben!"
            newTask = "Neue Aufgabe ..."
            newResponsePerson = "Zuweisen an..."
        }
        else if (language == "en")
        {
            openJobs = "No uncompleted tasks!"
            newTask = "New Task ..."
            newResponsePerson = "Assign to ..."
        }
        else if (language == "sp")
        {
            openJobs = "No hay tarea abierta!"
            newTask = "Nueva tarea ..."
            newResponsePerson = "Asignar a ..."
        }
        else if (language == "fr")
        {
            openJobs = "Pas de tâche ouverte!"
            newTask = "Nouvelle tâche ..."
            newResponsePerson = "Affecter à ..."
        }
        else
        {
            openJobs = "No uncompleted tasks!"
            newTask = "New Task ..."
            newResponsePerson = "Assign to ..."
        }

        var cardName = this.config.name
        if (!cardName)
        {
            cardName = state.attributes.friendly_name
        }    

        let persons = state.attributes.settings.persons;

        return html`<meta name="viewport" content="width=device-width, initial-scale=1.0">
            <ha-card>
            ${(this.config.show_header === undefined) || (this.config.show_header !== false)
                ? html`<h1 class="card-header">
                    <div class="name">${cardName}</div>
                </h1>`
                : html``}
            ${items.length
                ? html`<div class="todoist-list">
                    ${items.map(item => {

                        let icon
                        let CSSclass
                        if (item.checked == 0)
                        {
                            icon = "mdi:checkbox-marked-circle-outline"
                            CSSclass = "todoist-item-close-green"
                        }
                        else if (item.checked == 1)
                        {
                            icon = "mdi:cancel"
                            CSSclass = "todoist-item-close-red"
                        }

                        return html`<div class="todoist-item">
                            ${(this.config.show_item_close === undefined) || (this.config.show_item_close !== false)
                                ? html`<ha-icon-button
                                    icon="${icon}"
                                    class="${CSSclass}"
                                    @click=${() => this.itemClose(item.id)}
                                ></ha-icon-button>`
                                : html`<ha-icon
                                    icon="mdi:circle-medium"
                                ></ha-icon>`}
                            ${(item.checked == 0)
                                ? html `<div class="todoist-item-text">${item.content} ${item.responsePerson ? html `(${item.responsePerson})` : html ``}</div>` : html ``
                            }
                            ${(item.checked == 1)
                                ? html `<div class="todoist-item-text-checked">${item.content} ${item.responsePerson ? html `(${item.responsePerson})` : html ``}</div>` : html ``
                            }
                            ${(this.config.show_item_delete === undefined) || (this.config.show_item_delete !== false)
                                ? html`<ha-icon-button
                                    icon="mdi:trash-can-outline"
                                    class="todoist-item-delete"
                                    @click=${() => this.itemDelete(item.id)}
                                ></ha-icon-button>`
                                : html``}
                            ${(this.config.show_item_edit === undefined) || (this.config.show_item_edit !== false)
                                ? html `<ha-icon-button
                                icon="mdi:pencil"
                                class="todoist-item-edit"
                                @click=${() => this.itemEdit(item.id, item.content, item.responsePerson)}
                                ></ha-icon-button>` 
                                : html `` }
                        </div>`;
                    })}
                </ul>`
                : html`<div class="todoist-list-empty">${openJobs}</div>`}
            ${(this.config.show_item_add === undefined) || (this.config.show_item_add !== false)
                ? html`
                <paper-input
                    id="todoist-card-item-add"
                    type="text"
                    class="todoist-item-add"
                    placeholder="${newTask}"
                    @keyup=${this.itemAddorUpdate}
                />
                </paper-input>
                
                <paper-dropdown-menu
                vertical-align="bottom"
                label="${newResponsePerson}"
                class="todoist-item-addResponsePerson"
                id="todoist-card-item-addResponsePerson"
                >
                <paper-listbox
                    slot="dropdown-content"
                    .selected=""
                >
                    ${persons.map(person => {
                        return html`<paper-item>${person}</paper-item>`;
                    })}
                </paper-listbox>
            </paper-dropdown-menu>
            <ha-icon-button
                icon="mdi:content-save-move"
                class="todoist-item-save"
                @click=${this.itemAddorUpdate}
            >
            </ha-icon-button>`
                : html``}
        </ha-card>`;
    }
    
    static get styles() {
        return css`

            .card-header {
                padding-bottom: unset;
                margin-left: 15px;
            }
            
            .todoist-list {
                display: flex;
                flex-direction: column;
                padding: 15px 15px 0px 15px;
            }
            
            .todoist-list-empty {
                padding: 15px;
                text-align: center;
                font-size: 24px;
            }
            
            .todoist-item {
                display: flex;
                flex-direction: row;
                line-height: 48px;
            }
            
            .todoist-item-text {
                font-size: 16px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                font-weight: bold;
            }

            .todoist-item-text-checked {
                font-size: 16px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                text-decoration: line-through;
            }
            
            .todoist-item-close-green {
                color: #008000;
            }

            .todoist-item-close-red {
                color: #ff0000;
            }

            .todoist-item-edit {
                color: #616161;
            }            
            
            .todoist-item-delete {
                margin-left: auto;
                color: #800000;
            }

            .todoist-item-save {
                display: inline-block;
                position: absolute;
                margin-top: 20px;
            }

            .todoist-item-addResponsePerson {
                width: calc(100% - 90px);
                margin-bottom: 15px;
                margin-left: 25px;
            }

            .todoist-item-add {
                width: calc(100% - 50px);
                margin: 0 0 0 15px;
                padding-right: 10px;
                padding-left: 10px;
            }

            @media only screen and (min-width: 1200px) {
                .todoist-item-addResponsePerson {
                    width: auto;
                    margin: 0px 0px 15px 0px;
                    display: inline-block;
                }
                .todoist-item-add {
                    width: calc(100% - 305px);
                    display: inline-block;
                    padding-left: 10px;
                }
            }
            
        }
        `;
    }
}

customElements.define('localtodo-card-editor', TodoistCardEditor);
customElements.define('localtodo-card', TodoistCard);

window.customCards = window.customCards || [];
window.customCards.push({
    preview: true,
    type: 'localtodo-card',
    name: 'LocalToDo Card',
    description: 'Custom card for displaying lists from local SQLite DB.',
});

console.info(
    '%c LOCALTODO-CARD ',
    'color: white; background: orchid; font-weight: 700',
);