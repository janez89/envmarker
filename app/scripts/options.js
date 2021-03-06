// saves options to chrome.storage
function save_options() {
	var configs = document.getElementsByTagName('tr');
	var configs_array = [];
	for(var i = 0; i<configs.length;i++) {
		var uuid = configs[i].querySelector('.uuid') && configs[i].querySelector('.uuid').value || uuidv4(); 
		var name = configs[i].querySelector('.name') && configs[i].querySelector('.name').value; 
		var address = configs[i].querySelector('.address') && configs[i].querySelector('.address').value; 
		var color = configs[i].querySelector('.color') && configs[i].querySelector('.color').value;
		var position = configs[i].querySelector('.position') && configs[i].querySelector('.position').value;  
		
		if(uuid && name && address && color && position) {
			var obj = {
				uuid: uuid,
				name: name,
				address: address,
				color: color,
				position: position
			}
			configs_array.push(obj);
		} 
	}
	
	chrome.storage.sync.set({current_state: {
		last_update: new Date().getTime(),
		env_settings: configs_array
	}}, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Successfully updated!';
    setTimeout(function() {
    	status.textContent = '';
    }, 750);
});
}

// deletes a line
function _deleteAction(e) {
	e.target.parentNode.parentNode.parentNode.removeChild(e.target.parentNode.parentNode);
}

// adds delete behavior to the last column
function _addDeleteAction() {
	var deletebuttons = document.getElementsByClassName('delete');
	for (var i = 0; i < deletebuttons.length; i++) {
		deletebuttons[i].addEventListener('click', _deleteAction, false);
	}
}

// generate a new uuid
function uuidv4() {
	var dt = new Date().getTime();
	var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = (dt + Math.random()*16)%16 | 0;
		dt = Math.floor(dt/16);
		return (c=='x' ? r :(r&0x3|0x8)).toString(16);
	});
	return uuid;
}

// restore settings stored in chrome.storage.
function restore_options() {
	chrome.storage.sync.get({current_state: {
		env_settings: [{uuid: '0ac126c8-9aff-452b-b76c-941104854128', name: 'EXAMPLE', address: 'geovanneborges.com.br', color: '0000ff', position: 1},]
	}}, function(data) {
		var items = data.current_state;
		for(var i = 0; i<items.env_settings.length; i++) {
			var template = document.createElement('tr');
			var selectedPosition = items.env_settings[i].position || 1;
			var uuid = undefined;
			if (items.env_settings[i].uuid) {
				uuid = items.env_settings[i].uuid;
			} else {
				uuid = uuidv4();
			}
			var positionSelect = '<td><select class="position"><option '+(selectedPosition==1 ? 'selected="selected"' : '')+' value="1">Top-right</option><option '+(selectedPosition==2 ? 'selected="selected"' : '')+' value="2">Top-left</option><option '+(selectedPosition==3 ? 'selected="selected"' : '')+' value="3">Bottom-right</option><option '+(selectedPosition==4 ? 'selected="selected"' : '')+' value="4">Bottom-left</option></select></td>';
			template.innerHTML = '<tr><td><input class="uuid" type="hidden" value="'+uuid+'"><input class="name" value="'+items.env_settings[i].name+'" /></td><td><input class="address" value="'+items.env_settings[i].address+'" /></td><td><input class="color jscolor" value="'+items.env_settings[i].color+'" /></td>'+positionSelect+'<td><button class="delete" title="Remove"></button></td></tr>';
			document.getElementById('tbody').appendChild(template);
			jscolor.init();
			_addDeleteAction();
		}
	});
}

chrome.storage.onChanged.addListener(function(changes, namespace) {
	document.getElementById('tbody').innerHTML = '';	
	restore_options();  
});

// add more button action
function add_more() {
	var template = document.createElement('tr');
	var positionSelect = '<td><select class="position"><option selected="selected" value="1">Top-right</option><option value="2">Top-left</option><option value="3">Bottom-right</option><option value="4">Bottom-left</option></select></td>';
	template.innerHTML = '<tr><td><input class="uuid" type="hidden" value="'+uuidv4()+'"><input class="name" /></td><td><input class="address" /></td><td><input class="color jscolor" value="'+(Math.random()*0xFFFFFF<<0).toString(16)+'" /></td>'+positionSelect+'<td><button class="delete" title="Remove"></button></td></tr>';
	document.getElementById('tbody').appendChild(template);
	jscolor.init();
	_addDeleteAction();
}

// download the current settings as json
function exportSettings() {
	chrome.storage.sync.get({current_state: {
		env_settings: []
	}}, function(data) {
		var items = data.current_state;
		var a = document.createElement('a');
		a.setAttribute('href', 'data:text/plain;charset=utf-u,'+encodeURIComponent(JSON.stringify(items.env_settings)));
		a.setAttribute('download', 'envmarker.json');
		a.click();
	});
}

// merges imported settings with current one
function _mergeSettings(newconfig) {
	var currentconfig = [];
	chrome.storage.sync.get({current_state: {
		env_settings: []
	}}, function(data) {

		currentconfig = data.current_state;
		var config = newconfig.slice();

		for(var i = 0; i<currentconfig.env_settings.length; i++) {
			var exists = false;
			for(var j = 0; j<newconfig.length; j++) {
				if(currentconfig && currentconfig.env_settings[i] && currentconfig.env_settings[i].name && currentconfig.env_settings[i].name == newconfig[j].name) {
					exists = true;
				}
			}
			if(!exists) {
				config.push(currentconfig.env_settings[i]);
			}
		}
		
		chrome.storage.sync.set({current_state: {
			last_update: new Date().getTime(),
			env_settings: config
		}}, function() {
		// Update status to let user know options were saved.
		var status = document.getElementById('import-status');
		status.textContent = 'Successfully imported! Refreshing...';
		setTimeout(function() {
			location.reload();
		}, 750);
	});
	});
}

// import settings from a file
function importSettings(e) {
	var f = e.target.files[0];
	if (f) {
		var r = new FileReader();
		r.onload = function(e) { 
			var newconfig = e.target.result;
			try {
				_mergeSettings(JSON.parse(newconfig));
			} catch(e) {
				alert('An unexpected error occoured while loading the file.');
			}
		}
		r.readAsText(f);
	} else { 
		alert('An unexpected error occoured while loading the file.');
	}

}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
document.getElementById('more').addEventListener('click', add_more);
document.getElementById('export').addEventListener('click', exportSettings);
document.getElementById('import').addEventListener('change', importSettings);