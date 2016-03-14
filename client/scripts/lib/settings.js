const data = JSON.parse(localStorage.getItem('settings') || JSON.stringify({
	skintone: '',
	contactHistory: []
}));

export const getItem = key => data[key];
export const setItem = (key, stuff) => {
	data[key] = stuff;
	localStorage.setItem('settings', JSON.stringify(data));
};
