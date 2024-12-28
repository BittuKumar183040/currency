const from_items = document.querySelector("#from_items");
const to_items = document.querySelector("#to_items");

const current_date = document.querySelector("#current_date");
const from_inputField = document.querySelector("#from_inputField");
const to_inputField = document.querySelector("#to_inputField");

const reset = () => { localStorage.clear(); }

const date = new Date();
current_date.max = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`

const initialValue = {
    date: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
    amount: 1,
    from: "usd",
    to: "inr",
}

current_date.value = initialValue.date;
current_date.max = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
current_date.min = `${date.getFullYear()}-${date.getMonth()}-${2024 - 1}`;

// Fill select field with currency available
const currencyList = async () => {
    const list = localStorage.getItem("list");
    if (list) {
        return JSON.parse(list);
    }
    try {
        const res = await fetch("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies.min.json");
        const json = await res.json();
        localStorage.setItem("list", JSON.stringify(json));
        return json;
    } catch (error) {
        return {}
    }
}

const setSelectFields = (items) => {
    for (const item of items) {
        const optionForFrom = document.createElement("option");
        optionForFrom.innerText = item;
        from_items.appendChild(optionForFrom);

        const optionForTo = document.createElement("option");
        optionForTo.innerText = item;
        to_items.appendChild(optionForTo);
    }
    from_items.value = initialValue.from;
    to_items.value = initialValue.to;
}

currencyList()
    .then((val) => {
        setSelectFields(Object.keys(val));
    })
    .catch((err) => {
        setSelectFields(["No Currency Available"]);
        console.log(err);
    })

// -----------------------------------

const getRateJson = async (date, from, to) => {
    try {
        const res = await fetch(`https://${date}.currency-api.pages.dev/v1/currencies/${from}.min.json`);
        const { date: responseDate, [from]: rates } = await res.json();
        return { date: responseDate, from, to, [from]: rates[from], [to]: rates[to] };
    } catch (e) {
        console.log(e);
    }
};

const update_to = (val) => {
    document.querySelector("#to_tooltip").innerHTML = val.toFixed(7);
    to_inputField.value = val.toFixed(3);
}
const update_from = (val) => {
    document.querySelector("#from_tooltip").innerHTML = val.toFixed(7);
    from_inputField.value = val.toFixed(3);
}

const handle_change = (whom = "from") => {
    let from = from_items.value ? from_items.value : initialValue.from;
    let to = to_items.value ? to_items.value : initialValue.to;
    const date = current_date.value;
    switch (whom) {
        case "from":
            document.querySelector("#from_tooltip").innerHTML = "";
            getRateJson(date, from, to)
                .then((val) => {
                    update_to(val[to] * from_inputField.value);
                })
                .catch((err) => {
                    console.log(err);
                })
            break;
        case "to":
            document.querySelector("#to_tooltip").innerHTML = "";
            getRateJson(date, to, from)
                .then((val) => {
                    update_from(val[from] * to_inputField.value);
                })
                .catch((err) => {
                    console.log(err);
                })
            break;
    }
}

const validateInput = (element) => {
    const input = element.value.replace(/[^0-9.]/g, '');
    if (element.value !== input) {
        element.value = input;
        return false;
    }
    return true;
}

let timeoutId = null;
const handleInputChange = (target, whom) => {
    const inputValue = target.value;
    if (timeoutId) {
        clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
        handle_change(whom)
    }, 500);
}

from_inputField.addEventListener('input', (e) => {

    validateInput(e.target) && handleInputChange(e.target, "from");
})

to_inputField.addEventListener('input', (e) => {
    validateInput(e.target) && handleInputChange(e.target, "to");
})

const from_suggestions = document.querySelector(".from_suggestions")
const to_suggestions = document.querySelector(".to_suggestions")

function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}

const getSuggestions = (whom = "from") => {
    const n = 4
    const sugg_items = JSON.parse(localStorage.getItem(`${whom}_sugg`))
    if (!sugg_items) return [];
    const sugg_keys = Object.keys(sugg_items)
    if (sugg_keys.length < n + 1) {
        return sugg_keys;
    }
    const items = [... new Set(Object.values(sugg_items).sort().reverse())]
    return items
        .splice(0, n)
        .map(item => getKeyByValue(sugg_items, item))
}

function deleteDOMElement(element) {
    while (element.firstChild) {
        element.removeChild(element.lastChild);
    }
}

const SuggestionsToDom = () => {
    const from_items_sugg = getSuggestions("from");
    const to_items_sugg = getSuggestions("to");
    deleteDOMElement(from_suggestions)
    deleteDOMElement(to_suggestions)
    from_items_sugg.forEach((item) => {
        const p = document.createElement("p");
        p.innerText = item
        p.addEventListener('click', () => {
            from_items.value = item
            handle_change()
        })
        from_suggestions.appendChild(p)
    })
    to_items_sugg.forEach((item) => {
        const p = document.createElement("p");
        p.innerText = item
        p.addEventListener('click', () => {
            to_items.value = item
            handle_change()
        })
        to_suggestions.appendChild(p)
    })
}

const updateLocalItems = (selected, whom) => {
    let items = JSON.parse(localStorage.getItem(`${whom}_sugg`))
    if (items) {
        if (items[selected]) {
            items[selected] = items[selected] + 1
            localStorage.setItem(`${whom}_sugg`, JSON.stringify(items))
        } else {
            localStorage.setItem(`${whom}_sugg`, JSON.stringify({ ...items, [selected]: 1 }))
        }
    } else {
        localStorage.setItem(`${whom}_sugg`, JSON.stringify({ [selected]: 1 }))
    }
}

from_items.addEventListener('change', (e) => {
    handle_change();
    updateLocalItems(e.target.value, "from")
})
to_items.addEventListener('change', (e) => {
    handle_change();
    updateLocalItems(e.target.value, "to")
})

// initial commit
handle_change();
SuggestionsToDom();