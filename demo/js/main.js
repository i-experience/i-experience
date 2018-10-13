var container = document.getElementById( 'container' );

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.set( 0, 0, -10 );

var renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true });
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio( window.devicePixelRatio );
container.appendChild( renderer.domElement );

var controls = new THREE.OrbitControls( camera, renderer.domElement );
var clock = new THREE.Clock();

var lines = [];

var Params = function() {
	this.curves = true;
	this.circles = false;
	this.amount = 100;
	this.lineWidth = 10;
	this.taper = 'parabolic';
	this.animateWidth = false;
	this.autoRotate = true;
	this.autoUpdate = true;
	this.update = function() {
		clearLines();
		createLines();
	};
};

var params = new Params();
var gui = new dat.GUI();

window.addEventListener( 'load', function() {

	function update() {
		if( params.autoUpdate ) {
			clearLines();
			createLines();
		}
	}

	gui.add( params, 'curves' ).onChange( update );
	gui.add( params, 'circles' ).onChange( update );
	gui.add( params, 'amount', 1, 1000 ).onChange( update );
	gui.add( params, 'lineWidth', 1, 20 ).onChange( update );
	gui.add( params, 'taper', [ 'none', 'linear', 'parabolic', 'wavy' ] ).onChange( update );
	gui.add( params, 'autoUpdate' ).onChange( update );
	gui.add( params, 'update' );
	gui.add( params, 'animateWidth' );
	gui.add( params, 'autoRotate' );

	init();

} );

var TAU = 2 * Math.PI;
var hexagonGeometry = new THREE.Geometry();
for( var j = 0; j < TAU - 0.1; j += TAU / 100 ) {
	var v = new THREE.Vector3();
	v.set( Math.cos( j ), Math.sin( j ), 0 );
	hexagonGeometry.vertices.push( v );
}
hexagonGeometry.vertices.push( hexagonGeometry.vertices[ 0 ].clone() );

function createCurve() {

	var s = new THREE.ConstantSpline();
	var rMin = 5;
	var rMax = 10;
	var origin = new THREE.Vector3( Maf.randomInRange( -rMin, rMin ), Maf.randomInRange( -rMin, rMin ), Maf.randomInRange( -rMin, rMin ) );

	s.inc = 0.001;
	s.p0 = new THREE.Vector3( 0.5 - Math.random(), 0.5 - Math.random(), 0.5 - Math.random() );
	s.p0.set( 0, 0, 0 );
	s.p1 = s.p0.clone().add( new THREE.Vector3( 0.5 - Math.random(), 0.5 - Math.random(), 0.5 - Math.random() ) );
	s.p2 = s.p1.clone().add( new THREE.Vector3( 0.5 - Math.random(), 0.5 - Math.random(), 0.5 - Math.random() ) );
	s.p3 = s.p2.clone().add( new THREE.Vector3( 0.5 - Math.random(), 0.5 - Math.random(), 0.5 - Math.random() ) );
	s.p0.multiplyScalar( rMin + Math.random() * rMax );
	s.p1.multiplyScalar( rMin + Math.random() * rMax );
	s.p2.multiplyScalar( rMin + Math.random() * rMax );
	s.p3.multiplyScalar( rMin + Math.random() * rMax );

	s.calculate();
	s.calculateDistances();
	s.reticulate( { steps: 500 } );

 	var geometry = new THREE.Geometry();

	for( var j = 0; j < s.lPoints.length - 1; j++ ) {
		geometry.vertices.push( s.lPoints[ j ].clone() );
	}

	return geometry;

}

var colors = [
	0xed6a5a,
	0xf4f1bb,
	0x9bc1bc,
	0x5ca4a9,
	0xe6ebe0,
	0xf0b67f,
	0xfe5f55,
	0xd6d1b1,
	0xc7efcf,
	0xeef5db,
	0x50514f,
	0xf25f5c,
	0xffe066,
	0x247ba0,
	0x70c1b3
];

function clearLines() {

	lines.forEach( function( l ) {
		scene.remove( l );
	} );
	lines = [];

}

function makeLine( geo ) {

	var meshLine;

	var material = new THREE.MeshBasicMaterial( { color: new THREE.Color( colors[ ~~Maf.randomInRange( 0, colors.length ) ] ), meshLine: true, meshLineWidth: 10 } );

	switch ( params.taper ) {
		case 'none': meshLine = new THREE.MeshLine( geo, material ); break;
		case 'linear': meshLine = new THREE.MeshLine( geo, material, function( p ) { return 1 - p; } ); break;
		case 'parabolic': meshLine = new THREE.MeshLine( geo, material, function( p ) { return 1 * Maf.parabola( p, 1 ); } ); break;
		case 'wavy': meshLine = new THREE.MeshLine( geo, material,  function( p ) { return 2 + Math.sin( 50 * p ); } ); break;
	}

	if( params.circles ) {
		var r = 50;
		meshLine.position.set( Maf.randomInRange( -r, r ), Maf.randomInRange( -r, r ), Maf.randomInRange( -r, r ) );
		var s = 10 + 10 * Math.random();
		meshLine.scale.set( s,s,s );
		meshLine.rotation.set( Math.random() * 2 * Math.PI, Math.random() * 2 * Math.PI, Math.random() * 2 * Math.PI );
	}
	scene.add( meshLine );

	lines.push( meshLine );

}

function init() {

	createLines();
	onWindowResize();
	render();

}

function createLine() {
	if( params.circles ) makeLine( hexagonGeometry );
	if( params.curves ) makeLine( createCurve() );
}

function createLines() {
	for( var j = 0; j < params.amount; j++ ) {
		createLine();
	}
}

function onWindowResize() {

	var w = container.clientWidth;
	var h = container.clientHeight;

	camera.aspect = w / h;
	camera.updateProjectionMatrix();

	renderer.setSize( w, h );

}

window.addEventListener( 'resize', onWindowResize );

var tmpVector = new THREE.Vector3();

function render(time) {

	requestAnimationFrame( render );
	controls.update();

	var delta = clock.getDelta();
	var t = clock.getElapsedTime();
	lines.forEach( function( l, i ) {
		if ( params.animateWidth ) {

			l.material.meshLineWidth = params.lineWidth * ( 1 + 0.5 * Math.sin( 5 * t + i ) );

		}
		if( params.autoRotate ) {
			l.rotation.y += 0.125 * delta;
		}
	} );

	renderer.render( scene, camera );

}
