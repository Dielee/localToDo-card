# Local ToDo Card

Thanks to [@grinstantin](https://github.com/grinstantin) for the base js card.

Local ToDo card for [Home Assistant](https://www.home-assistant.io) Lovelace UI. This card displays items from local SQLite database.

![Preview of todoist-card](https://i.imgur.com/GkyXE5Z.png)

## Installing

### Manual

1. Download `localtodo-card.js` file from the [latest release](https://github.com/Dielee/localToDo-card/releases).
2. Put `localtodo-card.js` file into your `config/www` folder.
3. Add a reference to `localtodo-card.js` in Lovelace. There's two way to do that:
   1. **Using UI:** _Configuration_ → _Lovelace Dashboards_ → _Resources_ → Click Plus button → Set _Url_ as `/local/localtodo-card.js` → Set _Resource type_ as `JavaScript Module`.
   2. **Using YAML:** Add the following code to `lovelace` section.
      ```yaml
      resources:
        - url: /local/localtodo-card.js
          type: module
      ```
4. Add `custom:localtodo-card` to Lovelace UI as any other card (using either editor or YAML configuration).

### Setup DB Server
1. Change settings in config.yaml to your needs
   i. Docker
      1. `git clone https://github.com/Dielee/localToDo-card.git`   
      2. `docker build -t localtodo localToDo-card`
      3. `docker run -d -p ExternalPort:YamlServerPort localtodo`

   ii. Manual
      1. Install flask `pip3 install flask, PyYAML`
      2. Run main.py from /src `python3 main.py`


## Using the card

This card can be configured using Lovelace UI editor.

1. Add the following code to `configuration.yaml`:
    ```yaml
    sensor:
      - platform: rest
        name: To-do List
        method: GET
        resource: 'http://ipServerRuns:port/getToDoListItems'
        value_template: '{{value_json[''project''][''id'']}}'
        json_attributes:
          - items
          - settings
        scan_interval: 30

    rest_command:
      todoist:
        method: post
        url: 'http://ipServerRuns:port/setToDoListItems'
        payload: commands={{commands}}
        content_type: 'application/x-www-form-urlencoded'
    ```

2. Reload configs or restart Home Assistant.
3. In Lovelace UI, click 3 dots in top left corner.
4. Click _Edit Dashboard_.
5. Click _Add Card_ button in the bottom right corner to add a new card.
6. Find _Custom: Todoist Card_ in the list.
7. Choose `entity`.
8. Now you should see the preview of the card!

Typical example of using this card in YAML config would look like this:

```yaml
type: 'custom:localtodo-card'
entity: sensor.to_do_list
show_header: true
show_item_add: true
show_item_close: true
show_item_delete: true
```

Here is what every option means:

| Name                 |   Type    |   Default    | Description                                                     |
| -------------------- | :-------: | :----------: | --------------------------------------------------------------- |
| `type`               | `string`  | **required** | `custom:todoist-card`                                           |
| `entity`             | `string`  | **required** | An entity_id within the `sensor` domain.                        |
| `show_header`        | `boolean` | `true`       | Show friendly name of the selected `sensor` in the card header. |
| `show_item_add`      | `boolean` | `true`       | Show text input element for adding new items to the list.       |
| `show_item_close`    | `boolean` | `true`       | Show `close/complete` buttons.                                  |
| `show_item_delete`   | `boolean` | `true`       | Show `delete` buttons.                                          |

## Actions

- _Circle_ marks selected task as completed.
- _Trash bin_ deletes selected task.
- _Input_ adds new item to the list after pressing `Enter`.

