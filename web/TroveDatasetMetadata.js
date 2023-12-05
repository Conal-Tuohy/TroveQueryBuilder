(function TroveDatasetMetadataLibrary() {

class TroveDatasetMetadata extends HTMLElement {

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
      		div {
      			margin: 0.2em;
		}
      		button, input, select {
      			font-family: sans-serif;
      			font-weight: 300;
      			width: 100%;
		}
      	</style>
      	<div>
		<label for="proxy-metadata-name">Dataset name</label>
		<input name="proxy-metadata-name" id="proxy-metadata-name" type="text" value="" placeholder="My Dataset">
		
		<label for="proxy-metadata-description">Dataset description</label>
		<input name="proxy-metadata-description" id="proxy-metadata-description" type="text" value="" placeholder="A carefully curated collection of thought-provoking material.">
		
		<!-- TODO
		<label for="proxy-metadata-license-uri">Dataset license</label>
		<select name="proxy-metadata-license-uri" id="proxy-metadata-license-uri"></select>
		<datalist id="licenses">
			<option label=""></option>
		</datalist>
		-->
	</div>`;
	/*
	this.metadataName = this.shadowRoot.querySelector('#proxy-metadata-name');
	this.metadataDescription = this.shadowRoot.querySelector('#proxy-metadata-description');
	this.metadataLicenseURI = this.shadowRoot.querySelector('#proxy-metadata-license-uri');
	*/
	// add event listeners
	this.container = this.shadowRoot.querySelector('div');
	this.container.addEventListener('change', this.onChange.bind(this));
  }

  get value() {
    return this.value_;
  }
    
  onChange(event) {
    this.value_ = new FormData();
    // add the values from all the contained inputs
    const elements = this.shadowRoot.querySelectorAll('input, select');
    elements.forEach(
    	(element) => {
    		this.value_.append(element.name, element.value);
    	}
    );
    /*
    this.value_.append(this.metadataName.name, this.metadataName.value);
    this.value_.append(this.metadataDescription.name, this.metadataDescription.value);
    this.value_.append(this.metadataLicenseURI.name, this.metadataLicenseURI.value);
*/
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



customElements.define('trove-dataset-metadata', TroveDatasetMetadata);

})();