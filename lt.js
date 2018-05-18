/* globals exports */

(function(exports) {
  var abstractDef,
    abstractDefs,
    abstractFn,
    abstractFns,
    dict,
    evl,
    evlForm,
    evlForms,
    extractForm,
    fnNr,
    formReplace,
    re,
    supertrim;

  dict = {};
  fnNr = 0;
  re = /\{([^\s{}]*)(?:[\s]*)([^{}]*)\}/g;

  abstractDef = function(s, flag) {
    var body, index, name;

    flag = typeof flag === "undefined";
    s = abstractDefs(s, false);

    index = s.search(/\s/);
    name = s.substring(0, index).trim();
    body = s.substring(index).trim();

    if (body.substring(0, 4) === "_FN_") {
      dict[name] = dict[body];
    } else {
      body = evlForms(body);
      dict[name] = function() {
        return body;
      };
    }

    return flag ? name : "";
  };

  abstractDefs = function(s, flag) {
    while (s !== (s = formReplace(s, "{def", abstractDef, flag)));
    return s;
  };

  abstractFn = function(s) {
    var argl, args, body, i, index, name, regArgs;

    s = abstractFns(s);
    index = s.indexOf("}");
    args = supertrim(s.substring(1, index)).split(" ");
    argl = args.length;
    body = s.substring(index + 2).trim();
    name = "_FN_" + fnNr;
    fnNr += 1;

    for (regArgs = [], i = 0; i < argl; i += 1) {
      regArgs[i] = new RegExp(args[i], "g");
    }

    dict[name] = function() {
      var vall, vals;

      vals = supertrim(arguments[0]).split(" ");
      vall = vals.length;

      return (function(body) {
        var i, pargs;

        body = supertrim(body);

        if (vall < argl) {
          // partial application
          for (i = 0; i < vall; i += 1) {
            body = body.replace(regArgs[i], vals[i]);
          }

          pargs = args.slice(vall).join(" ");
          body = "{" + pargs + "} " + body;
          body = abstractFn(body);
        } else {
          // create form (ignore extra vals)
          for (i = 0; i < argl; i += 1) {
            body = body.replace(regArgs[i], vals[i]);
          }
        }

        return evlForms(body);
      })(body);
    };

    return name;
  };

  abstractFns = function(s) {
    while (s !== (s = formReplace(s, "{fn", abstractFn)));
    return s;
  };

  evl = function(s) {
    s = abstractFns(s);
    s = abstractDefs(s);
    s = evlForms(s);
    return s;
  };

  evlForm = function() {
    var f, r;

    f = arguments[1] || "";
    r = arguments[2] || "";

    return dict.hasOwnProperty(f)
      ? dict[f].apply(null, [r])
      : "(" + f + " " + r + ")";
  };

  extractForm = function(sym, str) {
    var d0, d1, d2, index, nb, start;

    start = str.indexOf(sym);

    if (start === -1) {
      return null;
    }

    switch (sym) {
      case "'{":
        d0 = 1;
        d1 = 1;
        d2 = 1;
        break;

      case "{":
        d0 = 0;
        d1 = 0;
        d2 = 1;
        break;

      default:
        d0 = 0;
        d1 = sym.length;
        d2 = 0;
        break;
    }

    nb = 1;
    index = start + d0;

    while (nb > 0) {
      index += 1;

      if (str.charAt(index) === "{") {
        nb += 1;
      } else if (str.charAt(index) === "}") {
        nb -= 1;
      }
    }

    return str.substring(start + d1, index + d2);
  };

  evlForms = function(s) {
    while (s !== (s = s.replace(re, evlForm)));
    return s;
  };

  formReplace = function(str, sym, fn, flag) {
    var r, s;

    sym += " ";
    s = extractForm(sym, str);
    r = s === null ? str : str.replace(sym + s + "}", fn(s, flag));

    return r;
  };

  supertrim = function(str) {
    return str.trim().replace(/\s+/g, " ");
  };

  exports.evl = function(s) {
    return evl(s);
  };
})(typeof exports === "undefined" ? (this.lt = {}) : exports);
