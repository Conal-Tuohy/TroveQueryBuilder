(function TroveFacetLibrary() {

class FacetMonitor {
	// TODO
	/*
	Track the values of the form: when the form changes, we should update the facet lists.
	
	1	Construct a FormData from the form:
		https://developer.mozilla.org/en-US/docs/Web/API/FormData/FormData
	2	Construct a facet query URL from the FormData
	3	Issue the query
	4	Parse the resulting facets and populate the trove-facet option lists
	
	There should be a single facet query sent to the Trove API which can be used to update all the trove-facet elements
	*/
	
	constructor() {
		this.facetElements = [];
		this.facetQueryURI = "";
		this.troveBaseURI = "https://api.trove.nla.gov.au/v3/result?";
	}
	/*
	* Register facets so that the TroveFormController will know to populate facets
	*/
	registerFacet(facet) {
		if (this.facetElements.length === 0) {
			// this is the first facet registered
			// get the facet's form and listen to its changes
			this.form = facet.form;
			facet.form.addEventListener("change", this.onChange.bind(this));
			// get the form's document, and listen for it to finish loading, so we can
			// issue the first facet query to Trove
			facet.form.ownerDocument.addEventListener("DOMContentLoaded", this.onLoaded.bind(this));
		}
		this.facetElements.push(facet);
		// DEBUG
		/*
		this.facetElements.forEach(
			facet => console.log(
				`registered facet ${facet.name}`
			)
		);
		*/
	}
	onLoaded(event) {
		// At this point the form has loaded and all facets will have been registered
		this.requestFacets();
	}
	onChange(event) {
		// the query specification has changed so facet values may need to be refreshed
		this.requestFacets();
	}
	
	applyFacetUpdates(data) {
		// The data is an object containing a "category" property which is an array of objects
		// with "code" and "name" properties, and a "facet" property which is an object with an 
		// single (but optional) "facets" property whose value is an array of facet objects, each
		// with "name" and "displayname" properties, and a "term" property whose value is
		// an array of term objects with "count", "search", "display" properties, and optionally
		// a "term" property whose value is an array of term objects (but without subordinate
		// terms.

		// We need to keep track of the facet display names and code names, and of the categories
		// which they belong to (a given facet value may apply to multiple categories).
		// For this purpose we define this object whose keys are facet names and whose values are objects 
		// with "name" and "displayname" properties, and a "terms" property which is an array of "term"
		// objects, each with a "search" and "display" property, and a "category" property whose value is
		// an array of category display names
		
		var facets = {}; 
		for (const category of data.category) {
			// The category contains a list of facets, each with their own facet values that apply within a given category
			//console.log(category.name);
			var categoryFacets = category.facets.facet;
			if (categoryFacets !== undefined) {
				// there are facets applicable to this category (NB some categories do not have facets)
				for (const categoryFacet of categoryFacets) {
					//console.log(`name: ${categoryFacet.name}, displayname: ${categoryFacet.displayname}`);
					for (const categoryFacetTerm of categoryFacet.term) {
						this.addFacetTerm(
							facets,
							categoryFacet.name, 
							categoryFacetTerm.display,
							categoryFacetTerm.search,
							category.name,
							categoryFacetTerm.count
						);
						var narrowerTerms = categoryFacetTerm.term;
						if (narrowerTerms !== undefined) {
							for (const categoryFacetNarrowerTerm of narrowerTerms) {
								this.addFacetTerm(
									facets,
									categoryFacet.name, 
									categoryFacetNarrowerTerm.display,
									categoryFacetNarrowerTerm.search,
									category.name,
									categoryFacetNarrowerTerm.count
								);
							}
						}
					}
				}
			}
		}
		//DEBUG
		//console.log(facets);
		// Finally, update the option lists of all the registered facet elements
		for (const facetElement of this.facetElements) {
			// the facetElement's name includes the 'l-' prefix which is not present in the facet
			// data returned from the Trove API query
			var facetName = facetElement.name.substring(2);
			var facetData = facets[facetName];
			//console.log(facetElement, facetData);
			facetElement.select_.innerHTML = '';
			if (facetData === undefined) {
				facetElement.select_.innerHTML = '<option value="" disabled="disabled">(no applicable values)</option>';
			} else {
				//console.log(facetData.terms);
				for (const term of facetData.terms.values()) {
					//console.log(term);
					var optionElement = document.createElement('option');
					optionElement.setAttribute('value', term.search);
					var counts = Object
						.getOwnPropertyNames(term.categoryCounts)
						.map((categoryName) => `${term.categoryCounts[categoryName]} ${categoryName}`)
						.join('; ');
					optionElement.append(term.display + '	   (' + counts + ')');
					facetElement.select_.append(optionElement);
				}
			}
		}
	}
	
	formatCount(count) {
		// returns a short representation of what is often a huge number
		if (count < 1000) {
			return count
		}
		if (count < 1000000) {
			return (count / 1000).toExponential(1).split('e')[0] + "k";
		}
		if (count < 1000000000) {
			return (count / 1000000).toExponential(1).split('e')[0] + "M";
		}
		return (count / 1000000000).toExponential(1).split('e')[0] + "B";
	}
	
	addFacetTerm(facets, facetName, termDisplay, termSearch, category, count) {
		// Record that a given term has been used as the value of a given facet, n times within a particular category
		// Facets is an object into which the data will be stored.
		// termDisplay is the display label for the term, termSearch is the value to be used in the query.
		// category is the (display) name of the category.
		// count is the number of times the term is used by items in this category
		// Note that the same term may have been used n times in category A and m times in category B
		// DEBUG
		//console.log(`facet ${facetName} uses term '${termDisplay}' (search form '${termSearch}') ${count} times in category '${category}'`);
		// The facets object has properties whose keys are facet code names, and whose values are individual facet objects,
		// each of which has the following properties:
		// "name" (the code name of the facet)
		// "terms" (a Map whose keys are search terms, and whose values are term objects)
		// Each term object has the following properties:
		// "display" (a display name)
		// "search" (a value to use in the query)
		// "categoryCounts" (an object whose keys are category display names and whose values are term counts)
		var facet = facets[facetName];
		if (facet === undefined) {
			facet = {
				name: facetName,
				terms: new Map()
			};
			facets[facetName] = facet;
		}
		var term = facet.terms.get(termSearch);
		if (term === undefined) {
			term = {
				display: termDisplay,
				search: termSearch,
				categoryCounts: {}
			}
			facet.terms.set(termSearch, term);
		}
		term.categoryCounts[category] = this.formatCount(count);
	}
	
	requestFacets() {
		// DEBUG
		/*
		this.facetElements.forEach(
			facet => console.log(
				`registered facet ${facet.name}`
			)
		);
		*/
		// construct a request URI from the form, 
		// TODO see if it has changed from last time
		// the facet values were retrieved; only if it has, then issue the new facet query
		var formData = new FormData(this.form);
		/* modify formData so it specifies
			TODO none of the proxy-* parameters (since query is direct to Trove API) 
				(not strictly necessary since Trove will ignore them) 
			None of the sorting, counting, etc parameters 
			None of the trove-facet elements 
			facet counts for all the registered facets 
			zero search results
			JSON result format
		*/
		[
			'key', 'n', 'sortby', 'bulkHarvest', 'reclevel', 'include',
			'proxy-format', 'proxy-include-people-australia'
		].forEach(
			(field) => formData.delete(field)
		);
		this.facetElements.forEach(
			(facet) => {
				formData.append("facet", facet.name.substring(2)); // trim the "l-" prefix from the facet name
				formData.delete(facet.name);
			}
		);
		// we don't need any records, we just want the facet details
		// We would set this to "0", but that triggers a 500 internal server error if the API call also specifies a value for one of the facet fields 
		formData.set("n", "1"); 
		formData.set("encoding", "json");
			
		var facetQueryURI = this.form.action + '?' + new URLSearchParams(formData).toString();
		// check if the facetQueryURI has changed (some form changes may not produce a new URL)
		if (facetQueryURI == this.facetQueryURI) {
			return;
		}
		this.facetQueryURI = facetQueryURI;
		//console.log(facetQueryURI);
		
		fetch(facetQueryURI, {referrerPolicy: 'origin'})
			.then(
				(response) => {
					if (!response.ok) {
						throw new Error(`HTTP error, status = ${response.status}`);
					}
					return response.json();
				}
			)
			.then(this.applyFacetUpdates	.bind(this));
	}
}

const facetMonitor = new FacetMonitor();

class TroveFacet extends HTMLElement {

  // Identify the element as a form-associated custom element
  static formAssociated = true;

  constructor() {
    super();
    // Get access to the internal form control APIs
    this.internals_ = this.attachInternals();
  }
  
  connectedCallback() {
      this.attachShadow({mode: 'open', delegatesFocus: true});
      this.shadowRoot.innerHTML = `
      	<style>
      		@import url('https://fonts.googleapis.com/css2?family=Sofia+Sans+Condensed:wght@400;700&family=Sofia+Sans+Extra+Condensed&display=swap');
      		button, input, select {
      			font-family: "Sofia Sans Condensed", sans-serif;
      			font-weight: 300;
      			width: 100%;
		}
      	</style>
      	<select name="facet" multiple="multiple"><option disabled="disabled" title="querying Trove">loading facet values...</option></select>`;
      this.select_ = this.shadowRoot.querySelector('select');
      // add event listeners
      this.select_.addEventListener('change', this.onChange.bind(this));
      // register this facet with the FacetMonitor which will provide it with facet values   
      facetMonitor.registerFacet(this);
  }

  get value() {
    return this.select_.value;
  }
  /*
  set value(value) {
    this.select_.value = value;
    this.internals_.setFormValue(value);
    var changeEvent = new Event("change", {bubbles: true});
    this.shadowRoot.host.dispatchEvent(changeEvent);
  }
  */
  
  get selectedOptions() {
  	  return this.select_.selectedOptions;
  }
  
  get selectedIndex() {
  	  return this.select_.selectedIndex;
  }
  
  set selectedIndex(index) {
  	  this.select_.selectedIndex(index);
  }
  
  onChange(event) {
    //var facet = event.target.getRootNode().host;
    //facet.value = event.target.value;
    this.value_ = new FormData();
    for (const option of this.select_.selectedOptions) {
    	this.value_.append(this.name, option.value);
    }
    this.internals_.setFormValue(this.value_);
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



customElements.define('trove-facet', TroveFacet);

})();