// Utility function to request the harvester to start harvesting from a URL

// The 'url' parameter is the URL of the set of harvests known to the harvester application; 
// (typically "http://localhost:8080/harvester/harvest/"). Making an HTTP POST to this URL
// will add a new harvest to the list of harvests. The harvester expects to receive parameters 
// encoded as application/x-www-form-urlencoded format (as an HTML form would send them).
//
// The 'urlSearchParams' parameter is an instance of urlSearchParams, used to make it easy
// for a JS client to emulate an HTML form. The urlSearchParams should contain the parameters
// needed to create a new harvest. Currently the only parameter expected is "url", though this may
// change. The value of the URL is the URL of a proxied Trove query.
//
// The function returns the URL of the harvest; a web page showing the progress of the harvest
// operation and providing access to the harvested data and metadata.
async function harvest(url, urlSearchParams) {
	// Default options are marked with *
	const response = await fetch(
		new URL(url, document.location).href, // resolve URL relative to current page location
		{
			method: "POST", 
			mode: "cors", // no-cors, *cors, same-origin
			cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
			credentials: "same-origin", // include, *same-origin, omit
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			redirect: "follow", // manual, *follow, error
			referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
			body: urlSearchParams
		}
	);
	return response.url; // the page describing the newly created harvest
}
