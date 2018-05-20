/* globals exports */

(function(exports) {
  "use strict";

  var abstractDef,
    abstractDefs,
    abstractFn,
    abstractFns,
    abstractIf,
    abstractIfs,
    balance,
    dict,
    evl,
    evlForm,
    evlForms,
    evlIfs,
    evlQuote,
    evlQuotes,
    extractForm,
    fnNr,
    formReplace,
    ifDisplay,
    ifNr,
    ifs,
    postprocessing,
    quot,
    quote,
    quotNr,
    re,
    supertrim,
    unquote;

  dict = {};
  ifs = {};
  quot = {};

  fnNr = 0;
  ifNr = 0;
  quotNr = 0;

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

    body = abstractIfs(body);

    dict[name] = function() {
      var vall, vals;

      vals = supertrim(arguments[0]).split(" ");
      vall = vals.length;

      return (function(body) {
        var i, pargs;

        body = evlIfs(body, regArgs, vals);
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
          // create form (i < argl to ignore extra vals)
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

  abstractIf = function(s) {
    var name;

    s = abstractIfs(s);
    name = "_IF_" + ifNr;
    ifNr += 1;

    ifs[name] = s;

    return name;
  };

  abstractIfs = function(s) {
    while (s !== (s = formReplace(s, "{if", abstractIf)));
    return s;
  };

  balance = function(s) {
    var stop, stopn, strt, strtn;

    strt = s.match(/\{/g);
    stop = s.match(/\}/g);

    strtn = strt ? strt.length : 0;
    stopn = stop ? stop.length : 0;

    return { left: strtn, right: stopn };
  };

  evl = function(s) {
    var bal;

    bal = balance(s);

    if (bal.left !== bal.right) {
      return s;
    }

    s = evlQuotes(s);
    s = abstractFns(s);
    s = abstractDefs(s);
    s = abstractIfs(s);
    s = evlForms(s);

    return postprocessing(s);
  };

  evlForm = function() {
    var f, r;

    f = arguments[1] || "";
    r = arguments[2] || "";

    return dict.hasOwnProperty(f)
      ? dict[f].apply(null, [r])
      : "(" + f + " " + r + ")";
  };

  evlIfs = function(body, regArgs, vals) {
    var cond, conds, i, i1, i2, m, name, res;

    m = body.match(/_IF_\d+/);

    if (m === null) {
      return body;
    }

    name = m[0];
    conds = ifs[name];

    // don't parse 'if' until it's evaluated (it might never be)
    i1 = conds.indexOf("then");

    if (i1 === -1) {
      return "(no 'then' in (if " + conds + "))";
    }

    i2 = conds.indexOf("else");

    cond = conds.substring(0, i1).trim();

    if (typeof regArgs !== "undefined" && typeof vals !== "undefined") {
      for (i = 0; i < vals.length; i++) {
        cond = cond.replace(regArgs[i], vals[i]);
      }
    }

    res =
      evlForms(cond) === "left"
        ? conds.substring(i1 + 5, i2 === -1 ? conds.length : i2).trim()
        : i2 === -1 ? "" : conds.substring(i2 + 5).trim();

    body = body.replace(name, res);
    body = evlIfs(body, regArgs, vals);

    return body;
  };

  evlQuote = function(s) {
    return quote(s);
  };

  evlQuotes = function(s) {
    while (s !== (s = formReplace(s, "{quote", evlQuote)));
    return s;
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

  ifDisplay = function(s) {
    return s.replace(/_IF_\d+/g, function(c) {
      return evlForms(evlIfs(c));
    });
  };

  postprocessing = function(s) {
    s = ifDisplay(s);
    s = unquote(s);

    return s;
  };

  quote = function(s) {
    var name;

    name = "_QUOT_" + quotNr;
    quotNr += 1;
    quot[name] = s;

    return name;
  };

  supertrim = function(s) {
    return s.trim().replace(/\s+/g, " ");
  };

  unquote = function(s) {
    s = s.replace(/_QUOT_\d+/, function(name) {
      return quot[name];
    });
    return s;
  };

  exports.evl = function(s) {
    return evl(s);
  };
})(typeof exports === "undefined" ? (this.lt = {}) : exports);
