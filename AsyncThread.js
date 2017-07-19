export default class Thread {
	constructor( program, callback ){

		this.events = new Array();

		try {

			let workerProgram = `(function(){

				var task = ${program};

				self.addEventListener("message", function( event ){

					self.postMessage(task(event.data));

				});

			})()`;

			let blob = new Blob([workerProgram], {
				type: "text/javascript"
			});

			this.worker = new Worker(window.URL.createObjectURL(blob));

			this.on("message", ( event )=>{

				callback(event.data);

			}, false);

		}
		catch( error ){

			console.warn("Do not support worker, fallback to synchronous");

			this.worker = program;

			this.callback = callback;

		};

		return this;

	}
	on( type, action, useCapture = false ){

		if( window.Worker != undefined && this.worker instanceof Worker ){

			var event = {
				type: type,
				action: action.bind(this),
				useCapture: useCapture
			};

			this.events.push(event);

			this.worker.addEventListener(event.type, event.action, event.useCapture);

		};

		return this;

	}
	off( type, action, useCapture ){

		if( window.Worker != undefined && this.worker instanceof Worker ){

			for( let index = 0, length = this.events.length; index < length; index++ ){

				let event = this.events[index];

				if( type == event.type && (action == event.action || action == undefined) && (useCapture == event.useCapture || useCapture == undefined) ){

					this.worker.removeEventListener(event.type, event.action, event.useCapture);

				};

			};

		};

		return this;

	}
	send( data ){

		if( window.Worker != undefined && this.worker instanceof Worker ){

			this.worker.postMessage(data);

		}
		else {

			this.callback(this.worker(data));

		};

		return this;

	}
	terminate(){

		for( let event of this.events ){

			this.off(event.type, event.action, event.useCapture);

		};

		if( window.Worker != undefined && this.worker instanceof Worker ){

			this.worker.terminate();

		};

		return this;

	}
}