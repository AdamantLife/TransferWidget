/** TransferWidget

	TransferWidget constructs a pair of lists with buttons between them transfer
  	items from one list to the other.
*/
class TransferWidget {
	/**
   * Creates a new TransferWidget
   * @param {Element} element - The root element which should be a div with the transfer widget class
   * @param {Object} [options] - Additional options for constructing the TransferWidget
   * @param {string} [options.listelement] - A class name to apply to the lists
   * @param {string} [options.buttonelement] - A class name to apply to the buttons
   * @param {Array} [options.list1] - Array of values to prepopulate the first/left/top list with. Each value should either be a string (which will be used for both the option's value and text) or a length-2 Array of strings which should be [value, text].
   * @param {Array} [options.list2] - Array of values to prepopulate the second/right/bottom list with. See options.list1 for more information
   */
    constructor(element, options) {
        this.root = element;
        this.options = Object.assign({}, TransferWidget.defaults);
        options = options === undefined ? {} : options;
        for (let key in this.options) {
            if (options[key] !== undefined) this.options[key] = options[key];
        }
        this.recreate();
        this.root.addEventListener("click", this._handleClick.bind(this));
    }

    /**
     * Event handler
     * @param {Event} event - The triggering event
     * @returns {null} - 
     */
    _handleClick(event) {
        if (!this.root.contains(event.target)) return;
        for (let box of this._lists) {
            if (box.contains(event.target)) return this._handleList(box, event);
        }
    }

    /**
     * Event handler for Click events on the Lists
     * @param {Element} box - the parent box to the triggering event
     * @param {Event} event - The triggering event
     */
    _handleList(box, event) {
        // elements contain themselves
        if (box === event.target) return;
        for (let child of box.getElementsByClassName("selected")) child.classList.remove("selected");
        event.target.classList.add("selected");
        this.root.dispatchEvent(new CustomEvent("selectitem", {
            detail:
            {
                item: event.target
            }
        }
        ));
    }

    /**
     * Recreates the widget
     */
    recreate() {
        while (this.root.lastChild) {
            this.root.removeChild(this.root.lastChild);
        }
        let boxes = [];
        this.root.insertAdjacentHTML('beforeend', TransferWidget.listelement);
        boxes.push(this.root.lastChild);
        this.root.insertAdjacentHTML("beforeend", `<div class="transferbuttonbox"></div>`);
        let buttonbox = this.root.lastChild;
        for (let i = 0; i < 2; i++) {
            buttonbox.insertAdjacentHTML('beforeend', TransferWidget.buttonelement);
            buttonbox.lastChild.onclick = (e) => this._moveElement(i);
            if (this.options.buttonelement && this.options.buttonelement !== undefined) {
                buttonbox.lastchild.classList.add(this.options.buttonelement);
            }
        }


        this.root.insertAdjacentHTML('beforeend', TransferWidget.listelement);
        boxes.push(this.root.lastChild);
        for (let [i, box] of boxes.entries()) {
            if (this.options.listelement && this.options.listelement !== undefined) {
                box.classList.add(this.options.listelement);
            } else {
                box.classList.add("default");
            }
            box.addEventListener("dblclick", () => this._moveElement(i));

            let prepopulate = this.options[`list${i + 1}`];
            if (prepopulate && prepopulate !== undefined) {

                for (let value of prepopulate) {
                    let option = typeof value === "string" ? `<li data-value="${value}"">${value}</li>` : `<li data-value="${value[1]}">${value[0]}</li>`;
                    box.insertAdjacentHTML("beforeend", option);
                }

            }
        }
    }

    /**
     * Internal method to return select elements
     * @type {Array}
     */
    get _lists() {
        return this.root.getElementsByClassName("transferlist");
    }

    /**
     * Internal callback to move an option from one box to the other.
     * @param {integer} i - Will be 0 or 1; 0 means from list 1 to list 2, 1 is the opposite.
     * @fires TransferWidget#moveitem
     */
    _moveElement(i) {
        let _from, _to;
        let boxes = this._lists;
        [_from, _to] = i ? [boxes[1], boxes[0]] : [boxes[0], boxes[1]];
        // No selection
        let selected = _from.querySelector("li.selected");
        if (!selected) return;

        _from.removeChild(selected);
        _to.appendChild(selected);

        // Clear selection from destination box
        // TODO: Consider clearing both
        for (let child of _to.getElementsByClassName("selected")) {
            child.classList.remove("selected");
        }

        this.root.dispatchEvent(new CustomEvent("moveitem", {
            detail:
            {
                from: _from,
                to: _to,
                item: selected
            }
        }
        ));
    }

    /**
     * Passes the arguments applied to the root element.
     */
    addEventListener() {
        this.root.addEventListener(...arguments);
    }

    /**
     * Adds an option to the given list
     * @param {integer} list - The zero-index of the list to add to (either 0 or 1).
     * @param {String} text - The text to display on the list.
     * @param {String} value - The value of the option.  If ommitted, text is used instead.
     * @fires TransferWidget#additem
     */
    addItem(list, text, value) {
        if (list !== 0 && list !== 1) throw new Error("Invalid list index (should be 0 or 1)");
        if (!text || text === undefined) throw new Error("Value is required");
        if (!value || value === undefined) value = text;

        let box = this._lists[list];
        box.insertAdjacentHTML("beforeend", `<li data-value="${value}">${text}</li>`);

        this.root.dispatchEvent(new CustomEvent("additem", {
            detail:
            {
                item: box.lastChild
            }
        }
        ));
    }

    /**
     * Adds multiple items to the lists
     * This is simply a for-loop applied to this.addItem, which means that
     * the additem event will be fired for each item.
     * @param {Array} items - An array of items to add to the list
     * @param {Object} items[] - An object containing the parameters for this.addItem
     */
    addMultiple(items) {
        for (let item of items) this.addItem(item.list, item.text, item.value);
    }

    /**
     * Returns an array for each list, each containing a [text, value] array for each option contained in that list at the moment
     * @param {integer} listnumber - Either 0 or 1 referring to which list to return: either the first/left/top or second/right/bottom list, respectively.
     * @returns {Array} - The Array or Array of Array returned.
     */
    getLists(listnumber) {
        let lists = [];

        for (let box of this._lists) {
            let values = [];
            for (let option of box.getElementsByTagName("li")) {
                values.push([option.innerText, option.dataset.value]);
            }
            lists.push(values);
        }

        if (listnumber !== undefined) return lists[listnumber];
        return lists;
    }

    /**
     * Removes the item from either list with the given value
     * Because values are assumed to be unique, this method does not take
     * any other identifiers
     * @param {String} value - The value to match for removal
     */
    removeItem(value) {
        let option = this.root.querySelector(`li[data-value=${value}]`);
        if (option) option.remove();
    }

    /**
     * Updates the class style for the given element
     * @param {String} element - Either "list" or "button"
     * @param {String} className - The class name to replace the current class with
     */
    updateStyle(element, className) {
        if (element !== "list" && element !== "button") throw new Error(`Invalid element name: should be "list" or "button"`);
        if (!className) className = "default";
        if (element === "list") { element = "transferlist"; }
        else { element = "transferbutton"; }
        for (let ele of this.root.getElementsByClassName(element)) {
            ele.className = element + " " + className;
        }
    }


    /**
     * Default Options
     * @property {Object} defaults - the default options. options are described in TransferWidget.constructor
     */
    static defaults = {
        listelement: undefined,
        buttonelement: undefined,
        list1: undefined,
        list2: undefined
    };

    static listelement = `<ul class="transferlist"></ul>`;
    static buttonelement = `<a class="transferbutton" type="button"></a>`;
}