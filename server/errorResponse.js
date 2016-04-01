
function errorResponse(res, e) {
	res.status(500);
	res.json({
		error: e.message,
		stack: e.stack
	});
	console.log({
		error: e.message,
		stack: e.stack
	});
}

module.exports = errorResponse;
