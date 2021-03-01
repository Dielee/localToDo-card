# Local ToDo Card

Thanks to @grinstantin for base js card.

Local ToDo card for [Home Assistant](https://www.home-assistant.io) Lovelace UI. This card displays items from local SQLite database.

![Preview of todoist-card](https://user-images.githubusercontent.com/34913257/108243361-a8ea8500-7156-11eb-8313-a149a7cf38b8.png)

## Installing

### Manual

1. Download `localtodo-card.js` file from the [latest release](https://github.com/grinstantin/todoist-card/releases/latest).
2. Put `localtodo-card.js` file into your `config/www` folder.
3. Add a reference to `localtodo-card.js` in Lovelace. There's two way to do that:
   1. **Using UI:** _Configuration_ → _Lovelace Dashboards_ → _Resources_ → Click Plus button → Set _Url_ as `/local/localtodo-card.js` → Set _Resource type_ as `JavaScript Module`.
   2. **Using YAML:** Add the following code to `lovelace` section.
      ```yaml
      resources:
        - url: /local/localtodo-card.js
          type: module
      ```
4. Add `custom:todoist-card` to Lovelace UI as any other card (using either editor or YAML configuration).

## Using the card

This card can be configured using Lovelace UI editor.

1. Add the following code to `configuration.yaml`:
    ```yaml
    sensor:
      - platform: rest
        name: To-do List
        method: GET
        resource: 'https://api.todoist.com/sync/v8/projects/get_data'
        params:
          token: !secret todoist_api_token
          project_id: TODOIST_PROJECT_ID
        value_template: '{{value_json[''project''][''id'']}}'
        json_attributes:
          - items
        scan_interval: 30

    rest_command:
      todoist:
        method: post
        url: 'https://api.todoist.com/sync/v8/sync'
        payload: !secret todoist_api_payload
        content_type: 'application/x-www-form-urlencoded'
    ```
2. ... and to `secrets.yaml`:
    ```yaml
    todoist_api_token: TODOIST_API_TOKEN
    todoist_api_payload: token=TODOIST_API_TOKEN&commands={{commands}}
    ```
3. Replace `TODOIST_API_TOKEN` with your [token](https://todoist.com/prefs/integrations) and `TODOIST_PROJECT_ID` with ID of your selected Todoist project.
    > Your can get `TODOIST_PROJECT_ID` from project URL, which usually looks like this:
    `https://todoist.com/app/project/TODOIST_PROJECT_ID`
4. Reload configs or restart Home Assistant.
5. In Lovelace UI, click 3 dots in top left corner.
6. Click _Edit Dashboard_.
7. Click _Add Card_ button in the bottom right corner to add a new card.
8. Find _Custom: Todoist Card_ in the list.
9. Choose `entity`.
10. Now you should see the preview of the card!

Typical example of using this card in YAML config would look like this:

```yaml
type: 'custom:todoist-card'
entity: sensor.to_do_list
show_header: true
show_item_add: true
show_item_close: true
show_item_delete: true
only_today_overdue: false
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
| `only_today_overdue` | `boolean` | `false`      | Only show tasks that are overdue or due today.                  |

## Actions

- _Circle_ marks selected task as completed.
- _Trash bin_ deletes selected task.
- _Input_ adds new item to the list after pressing `Enter`.

## License

MIT © [Konstantin Grinkevich](https://github.com/grinstantin)
