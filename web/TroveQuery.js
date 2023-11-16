(function TroveQueryLibrary() {

const css=
`
/*
	div {
		border-style: solid;
		border-width: 1px;
		border-color: yellow;
	}*/
	div.controls {
		display: flex;
		justify-content: flex-end;
		column-gap: 0.2em;
	}
	div.q-group {
		display: flex;
		align-items: center;
		column-gap: 0.2em;
		//background-color: rgb(252, 247, 232);
		box-sizing: border-box;
		padding: 0.2em;
	}
	button[name='delete-group'] {
	}
	div.q-condition {
		display: flex;
		margin: 0.2em;
/*		border-style: solid;
		border-width: 0.2em;
		border-color: white;
		background-color: white;*/
	}
	div.q-group-content-and-addition-controls {
		display: flex;
		flex-direction: column;
		flex: 1; /* this item takes up as much horizontal space as possible */
		border-radius: 0.5em;
		border-width: 0.25em;
		border-color: rgb(200, 200, 200); //rgb(231, 192, 75);
		border-style: solid;
	}
	div.q-group-content {
		display: flex;
		flex-direction: column;
		/*
		border-radius: 0.5em;
		border-width: 0.5em;
		border-color: gray;
		border-style: solid;
		*/
	}
	div.q-condition input[type='text'] {
		flex: 1;
	}
	div.radio {
		/* prevent wrapping of radio buttons and labels */ 
		white-space : nowrap;
	}
	div.radio input[type="radio"]:checked + label {
		font-weight: bold;
	}
	div.and-or {
		display: flex;
		flex-direction: column;
		justify-content: center;
		margin: 0.2em;
	}
	div.addition-controls {
		display: flex;
		flex-direction: row;
		justify-content: end;
		margin: 0.2em;
	}
	svg.bracket {
		height: 100%;
		width: auto;
	}
	input.text {
		flex: 1;
	}
`;
const troveQueryStylesheet = new CSSStyleSheet();
troveQueryStylesheet.replaceSync(css);

class TroveQuery extends HTMLElement {

  // Identify the element as a form-associated custom element
  static formAssociated = true;

  constructor() {
    super();
    // Get access to the internal form control APIs
    this.internals_ = this.attachInternals();
    // internal value for this control
    this.value_ = '';
  }  
  
  connectedCallback() {

      this.attachShadow({mode: 'open', delegatesFocus: true});
      // TODO get this working
      //this.shadowRoot.adoptedStylesheets = [troveQueryStylesheet];
      
        this.shadowRoot.innerHTML = 
        	"<style>" + css + "</style>" +
           this.renderQGroupAsHTML(this.newQGroup());
      this.rootGroup = this.shadowRoot.querySelector('div.q-group');
      // add event listeners
	this.rootGroup.addEventListener("click", this.onClick.bind(this));// bind the TroveQuery so it's accessible within the event handler
	this.rootGroup.addEventListener("change", this.onChange.bind(this));

      this.setAttribute('tabindex', 0);   
  }
  
  // data in the query subform has changed: update the trove-query element's value
onChange(event) {
	this.value = this.getQueryValue(this.rootGroup);
}
onClick(event) {
	switch (event.target.name) {
		case "add-condition": 
			{
				event.target
					.closest(".q-group") // group containing the 'add condition' button
					.querySelector(".q-group-content") // container for the new condition
					.insertAdjacentHTML(
						"beforeend", // insert as list child
						this.renderConditionAsHTML(this.newQCondition()) // ... a new blank condition
					);
				event.preventDefault(); // the browser should not handle this event
				break;
			}
		case "add-group":
			{
				event.target
					.closest(".q-group") // group containing the 'add group' button
					.querySelector(".q-group-content") // container for the new condition
					.insertAdjacentHTML(
						"beforeend", // insert as list child
						this.renderQGroupAsHTML(this.newQGroup()) // ... a new blank group
					);
				event.preventDefault(); // the browser should not handle this event
				break;
			}
		case "delete-condition":
			{
				// We don't want to delete a condition if it's the only one in its group, so ...
				// first find the div containing this condition and any sibling conditions
				var groupContent = event.target.closest('.q-group-content');
				if (groupContent.children.length == 1) {
					// this is the only condition in the group; reset it rather than delete it
					groupContent.innerHTML = this.renderConditionAsHTML(newQCondition());
				} else {
					// there are other conditions in the group; so it's safe to delete it
					event.target
						.closest(".q-condition") // condition containing the "delete condition" button
						.remove();
				}
				event.preventDefault(); // the browser should not handle this event
				break;
			}
		case "delete-group":
			{
				var group = event.target.closest(".q-group"); // group containing the "delete group" button
				var parentGroup = group.parentElement.closest(".q-group"); 
				if (parentGroup) {
					// the group has a parent group, so deleting it won't leave the form empty
					group.remove();
				} else {
					// no parent group, so don't delete this group: just reset it by replacing its content with an empty condition
					this.getNodeByXPath(group, "div[@class='q-group-content']") // container for the new condition
						.innerHTML = this.renderConditionAsHTML(newQCondition());
				}
				event.preventDefault(); // the browser should not handle this event
				break;
			}
		}
}
  
  // Form controls usually expose a "value" property
  get value() { return this.value_; }
  set value(value) { 
  this.value_ = value; 
    this.internals_.setFormValue(value);
    var changeEvent = new Event("change", {bubbles: true});
    this.shadowRoot.host.dispatchEvent(changeEvent);
}
  // functions for converting the structured UI content into a form value
// utility function to get a single node by xpath 
 getNodeByXPath(context, xpath) {
	return document.evaluate(
		xpath,
		context, 
		null,
		XPathResult.FIRST_ORDERED_NODE_TYPE
	).singleNodeValue;
}
 getQueryValue(element) {
 	 var troveQuery = this;
	switch (element.tagName) {
		case "DIV": {
			switch (element.className) {
				case "q-group": {
					var booleanOperator = this.getGroupOperator(element);
					var groupContent = this.getGroupContents(element);
					var query = groupContent.reduce(
						function(query, item) {
							if (query != "") {
								query = query + ' ' + booleanOperator + ' ';
							}
							query = query + troveQuery.getQueryValue(item);
							return query;
						},
						"" // start with empty url string
					);
					return query ? "(" + query + ")": "";
					break;
				}
				case "q-condition": {
					var index = this.getNodeByXPath(element, "select[@name='index']").value;
					var indexTerm = (index == "") ? "" : index + (":");
					var operator = this.getNodeByXPath(element, "select[@class='operator']").value;
					// TODO deal with other data types
					var value = this.getNodeByXPath(element, "input").value;
					var condition = "";
					if (value) {
						switch (operator) {
							// TODO encode characters that are special for Solr
							case "contains-phrase": condition = indexTerm + '"' + value + '"'; break;
							case "contains-words": condition = indexTerm + '(' + value + ')'; break;
						}
					}
					if (condition) return "(" + condition + ")";
					return "";
					break;
				}
			}
		}
	}
}

 getGroupOperator(group) {
	// return the boolean operator of the `group` <div> element
	return this.getNodeByXPath(
		group, 
		"div[@class='and-or']//input[@type='radio'][@value='AND']"
	).checked ? 'AND' : 'OR';
}

 getGroupContents(group) {
	// return an array of the <div> elements representing each `group` and `condition`
	// within the specified `group` <div> element
	var contents = new Array();
	var groupContent = document.evaluate(
		"div[@class='q-group-content-and-addition-controls']/div[@class='q-group-content']/div",
		group,
		null,
		XPathResult.ORDERED_NODE_ITERATOR_TYPE
	);
	var item = groupContent.iterateNext();
	while (item) {
		contents.push(item);
		item = groupContent.iterateNext();
	}
	return contents;
}

 getQ(group) {
	var groupsAndConditions = document.evaluate(
		"div[@class='q-group-content-and-addition-controls']/div[@class='q-group-content']/div",
		group, 
		null,
		XPathResult.UNORDERED_NODE_ITERATOR_TYPE
	);
	var item = groupsAndConditions.iterateNext();
	var query = "";
	while (item) {
		query = query + "("; 
		// TODO output the condition or group groupsAndConditions.snapshotItem()
		query = query + ")";
		item = groupsAndConditions.iterateNext();
	};
	return query;
}  

 renderQGroupAsHTML (qGroup) {
	// A q-group is a logical grouping (i.e. a parenthesised expression) within the `q` parameter
	// of a Trove API query
	// radio buttons are grouped (using a random name) so that selecting one automatically deselects the other 
	var radioGroupName = "radio-" + Math.random();
	return `
		<div class='q-group'>
		<div class="and-or">
			<div class="radio">
				<input type="radio" id="and-${radioGroupName}" name="conditions-${radioGroupName}" 
					title="all conditions in this group must apply" 
					value="AND" 
					checked="checked"
				/>
				<label title="all conditions in this group must apply"  for="and-${radioGroupName}">and</label>
			</div>
			<div class="radio">
				<input title="at least one condition in this group must apply" type="radio" id="or-${radioGroupName}" name="conditions-${radioGroupName}" value="OR"/>
				<label title="at least one condition in this group must apply" for="or-${radioGroupName}">or</label>
			</div>
		</div>
		<div class="q-group-content-and-addition-controls">
			<div class="q-group-content">
				${
					qGroup.content
						.map(
							(item) => item.type=='q-group' ? this.renderQGroupAsHTML(item) : this.renderConditionAsHTML(item)
						).join()
				}
			</div>
			<div class='addition-controls'>
				<button name="add-group">Add group</button>
				<button name="add-condition">Add condition</button>
			</div>
		</div>
		<button name="delete-group" title="Delete group">◀ 🗑️</button>
	</div>`;
}

 renderConditionAsHTML(condition) {
	return `
		<div class='q-condition'>
			<select name="index">
				${this.renderIndexOptionsAsHTML(condition.index)}
			</select>
			${this.renderOperatorOptionsAsHTML(condition.index)}
			${this.renderValueInputAsHTML(condition.index)}
			<button name="delete-condition" title="Delete condition">◀ 🗑️</button>
		</div>`;
}

renderOperatorOptionsAsHTML(indexName) {
	var index = this.indexes.find(
		(index) => index.name == indexName
	);
	var html;
	var operatorId = "operator-" + Math.random();
	switch (index.type) {
		case 'boolean':
			html = `<!-- no UI needed -->`;
			break;
		case 'string':
			html = `
				<select class="operator" name="${operatorId}">
					<option selected="selected" value="contains-words">contains words</option>
					<option value="contains-phrase">contains phrase</option>
				</select>
			`;
			break;
		default:
			html = `<!-- unknown type for index ${index.name} -->`;
			break;
	}
	return html;
}


 renderValueInputAsHTML(indexName) {
	var index = this.indexes.find(
		(index) => index.name == indexName
	);
	var html;
	switch (index.type) {
		case 'boolean':
			html = `<input type="checkbox" checked="checked" name="index-${index.name}" />`;
			break;
		case 'string':
			html = `<input type="text" name="index-${index.name}" value=""/>`;
			break;
		default:
			html = `<!-- unknown type for index ${index.name} -->`;
			break;
	}
	return html;
}

indexes = [
        {
            "name": "",
            "label": "Entire record",
            "type": "string",
            "input": "text"
        },
        {
            "name": "creator",
            "label": "Creator",
            "type": "string",
            "input": "text"
        },
        {
            "name": "subject",
            "label": "Subject",
            "type": "string",
            "input": "text"
        },        
        {
            "name": "title",
            "label": "Title",
            "type": "string",
            "input": "text"
        },        
        {
            "name": "s_creator",
            "label": "Creator (stemmed form)",
            "type": "string",
            "input": "text"
        }, 
        {
            "name": "s_subject",
            "label": "Subject (stemmed form)",
            "type": "string",
            "input": "text"
        }, 
        {
            "name": "s_title",
            "label": "Title (stemmed form)",
            "type": "string",
            "input": "text"
        }, 
        {
            "name": "exact_creator",
            "label": "List creator (exact form)",
            "type": "string",
            "input": "text"
        }, 
        {
            "name": "format",
            "label": "Format",
            "type": "string",
            "input": "select",
            "multiple": true,
            "values": [
            	"magazine", "image", "research", "book", "diary", "music"
            ]
        }, 
        {
            "name": "isbn",
            "label": "ISBN",
            "type": "string",
            "input": "text"
        }, 
        {
            "name": "issn",
            "label": "ISSN",
            "type": "string",
            "input": "text"
        }, 
        {
            "name": "publictag",
            "label": "Public tag",
            "type": "string",
            "input": "text"
        }, 
        {
            "name": "nuc",
            "label": "NUC (id) of holding institution",
            "type": "string",
            "input": "text"
        }, 
        {
            "name": "id",
            "label": "Trove identifier of work",
            "type": "string",
            "input": "text"
        }, 
        {
            "name": "identifier",
            "label": "Public identifier",
            "type": "string",
            "input": "text"
        }, 
        {
            "name": "anbdid",
            "label": "Libraries Australia record identifier",
            "type": "string",
            "input": "text"
        }, 
        {
            "name": "ddc",
            "label": "Dewey Decimal Classification number",
            "type": "string",
            "input": "text"
        },     
        {
            "name": "lastupdated",
            "label": "Date of last update",
            "type": "date",
            "input": "text"
        },     
        {
            "name": "taglastupdated",
            "label": "Date of last tag",
            "type": "string",
            "input": "text"
        },
        {
            "name": "commentlastupdated",
            "label": "Date of last comment",
            "type": "string",
            "input": "text"
        },
        {
            "name": "date",
            "label": "Date of publication",
            "type": "string",
            "input": "text"
        },
        {
            "name": "decade",
            "label": "Decade of publication",
            "type": "string",
            "input": "text"
        },    
        {
            "name": "has",
            "label": "Tags and comments",
            "type": "string",
            "input": "checkbox",
            "values": [
            	{
            		"value": "tags",
            		"label": "Tags"
            	},
            	{
            		"value": "comments",
            		"label": "Comments"
            	}
            ]
        },   
        {
            "name": "text",
            "label": "Text",
            "type": "string",
            "input": "text"
        },    
        {
            "name": "fulltext",
            "label": "Full text",
            "type": "string",
            "input": "text"
        },    
        {
            "name": "aust_language",
            "label": "Australian language",
            "type": "string",
            "input": "text"
        },    
        {
            "name": "fullTextInd",
            "label": "Has full text",
            "type": "string",
            "input": "text"
        },    
        {
            "name": "funder",
            "label": "Funder",
            "type": "string",
            "input": "text"
        },    
        {
            "name": "headingsAuthorAbstract",
            "label": "Title and first four lines",
            "type": "string",
            "input": "text"
        },    
        {
            "name": "imageInd",
            "label": "Thumbnail image",
            "type": "string",
            "input": "text"
        },    
        {
            "name": "rights",
            "label": "Rights",
            "type": "string",
            "input": "text"
        },    
        {
            "name": "placeOfPublication",
            "label": "Place of publication",
            "type": "string",
            "input": "text"
        },    
        {
            "name": "geographicCoverage",
            "label": "Geographic coverage",
            "type": "string",
            "input": "text"
        },    
        {
            "name": "cultural_sensitivity",
            "label": "Culturally sensitive",
            "type": "boolean",
            "input": "checkbox",
            "values": ["y", "n"]
        }
];

// renders a index as a drop down
 renderIndexOptionsAsHTML(selectedIndex) {
	var html= 
		this.indexes.map(
			(index) => `<option ${selectedIndex = index.value ? "selected='selected'":""} value="${index.name}">${index.label}</option>`
		).join('');
	return html;
}

 newQCondition(index = "", operator = "contains", value = "") {
	// create a new logical condition within the value of the `q` parameter
	return {
		"type": "q-condition",
		"index": index,
		"operator": operator,
		"value": value
	}
}

 newQGroup() {
	// create a new logical group for the `q` parameter
	// the group is created with a single condition
	var initialCondition = this.newQCondition();
	return { 
		"type": "q-group", 
		"operator": "AND", 
		"content": [initialCondition]
	}
}

  // The following properties and methods aren't strictly required,
  // but browser-level form controls provide them. Providing them helps
  // ensure consistency with browser-provided controls.
  get form() { return this.internals_.form; }
  get name() { return this.getAttribute('name'); }
  get type() { return this.localName; }
  get validity() {return this.internals_.validity; }
  get validationMessage() {return this.internals_.validationMessage; }
  get willValidate() {return this.internals_.willValidate; }

  checkValidity() { return this.internals_.checkValidity(); }
  reportValidity() {return this.internals_.reportValidity(); }

}

customElements.define('trove-query', TroveQuery);

})();