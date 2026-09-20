let _data = null;
let _email = "";
let _title = "";

export const pdfStore = {
  set(data, email, title) {
    _data = data;
    _email = email;
    _title = title;
  },
  get() {
    return { data: _data, email: _email, title: _title };
  },
  clear() {
    _data = null;
    _email = "";
    _title = "";
  },
};