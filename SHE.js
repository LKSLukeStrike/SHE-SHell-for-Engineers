// TOFIX

const NodeFS_       = require("node:fs")
const Colors_       = require("@colors/colors/safe")


// Utils
const log = console.log

function logOK() {
    log("OK")
}

function logNO() {
    log("NO")
}

function logAction(_message) {
    if (true) {
        log("\n" + Colors_.cyan(_message))
    }
}

function logStdout(_message) {
    if (true) {
        log(Colors_.grey(_message))
    }
}

function logStderr(_message) {
    if (true) {
        log(Colors_.yellow(_message)) // should throw an error
    }
}

function logResult(_message) {
    if (true) {
        log(Colors_.green(_message))
    }
}

function logFollow(_message) {
    if (false) {
        log(Colors_.blue(_message))
    }
}

function logOutput(_message) {
    log(Colors_.red(_message))
}

function argDefault(_index, _default) {
    return process.argv[_index] ? process.argv[_index] : _default
}

function notEmpty(_thing) {
    return _thing != undefined
}

function notNumber(_thing) {
    return Number.isNaN(Number(_thing))
}


class Stack {
    constructor() {
        this.items = []
    }

    clear() {
        return this.items = []
    }

    length() {
        return this.items.length
    }

    value() {
        return this.items
    }

    push(_item) {
        return this.items.push(_item)
    }

    pop() {
        return this.items.pop()
    }

    set(_item) {
        return this.items[this.items.length - 1] = _item
    }

    get() {
        return this.items[this.items.length - 1]
    }
}


// SHE Args
const ARGCode_     = argDefault(2, "SHE")

// SHE Files
const SHECodeFile_ = "./" + ARGCode_ + ".she"
const SHECodeSrc_  = NodeFS_.readFileSync(SHECodeFile_).toString()
// TODO remove comments


// Parse Tokens
const TokenWSpace_ = " "
const TokenIndent_ = "\t"
const TokenNWLine_ = "\n"
const TokenCRLine_ = "\r"
const TokenEOLine_ = ";"
const TokenSQuote_ = "'"
const TokenDQuote_ = "\""
const TokenEscape_ = "\\"
const TokenOBlock_ = "("
const TokenCBlock_ = ")"
const TokenRemark_ = "#"

// Parse States
const StateIgnore_ = 0
const StateSingle_ = 1
const StateSQuote_ = 2
const StateDQuote_ = 3
const StatePhrase_ = 4
const StateOBlock_ = 5
const StateCBlock_ = 6
const StateRemark_ = 7


// Parse
let   TokenState_  = StateIgnore_
let   ModeEscape_  = false // escape char in quotes
let   ModeNoLine_  = false // next line is part of the same line
let   TokenOBLvl_  = 0 // level of TokenOBlock_
let   SingleOCnt_  = 0 // number of TokenOBlock_ in a single
let   SHECodeIdx_  = 0

function parseSource() {
    TokenState_    = StateIgnore_
    let _phrases   = undefined
    let _phrase    = undefined
    let _word      = undefined
    let _char      = undefined

    function _logState(_where) {
        if (false) {
            console.log(_where, "c:", _char, "\tw:", _word, "\tp:", _phrase, "\tx:", _phrases, "\ts:", TokenState_, "\tl():", TokenOBLvl_, "\ts():", SingleOCnt_)
        }
    }

    function _pushChar() { // push a char into a word
        _logState("_pushChar")
        if (notEmpty(_char)) {
            if (notEmpty(_word)) {
                _word = _word + _char
            } else {
                _word = _char
            }
            _char = undefined
        }
        _logState("_pushChar")
    }

    function _pushWord() { // push a word into a phrase
        _logState("_pushWord")
        _pushChar()
        if (notEmpty(_word)) {
            if (notEmpty(_phrase)) {
                _phrase.push(_word)
            } else {
                _phrase = [_word]
            }
            _word = undefined
        }
        _logState("_pushWord")
    }

    function _pushPhrase() { // push a phrase into phrases
        _logState("_pushPhrase")
        _pushWord()
        if (notEmpty(_phrase)) {
            if (notEmpty(_phrases)) {
                _phrases.push(_phrase)
            } else {
                _phrases = [_phrase]
            }
            _phrase = undefined
        }
        _logState("_pushPhrase")
    }
    
    while (SHECodeIdx_ < SHECodeSrc_.length) {
        _char = SHECodeSrc_.at(SHECodeIdx_)
        _logState("parseSource")

        switch (TokenState_) {

            case StateIgnore_:
                if (_char = parseIgnore(_char)) {
                    _pushChar()
                } else {
                    switch (TokenState_) {

                        case StatePhrase_:
                            _pushPhrase()
                            TokenState_ = StateIgnore_
                        break

                        case StateOBlock_:
                            SHECodeIdx_++ // skip the TokenOBlock_
                            TokenOBLvl_++ // enter a new block
                            _word = parseSource() // word is a new block
                            _pushWord()
                            TokenState_ = StateIgnore_
                        break

                        case StateCBlock_:
                            if (TokenOBLvl_ > 0) {
                                TokenOBLvl_-- // close the block
                                _pushPhrase()
                                TokenState_ = StateIgnore_
                                return _phrases // return the block
                            } else {
                                logStderr(SHECodeSrc_.substring(0, SHECodeIdx_))
                                logStderr("Missing Open Block")
                                return
                            }
                        break

                    }

                }
            break

            case StateSingle_:
                if (_char = parseSingle(_char)) {
                    _pushChar()
                } else {
                    switch (TokenState_) {
                        
                        case StateIgnore_:
                            _pushWord()
                        break

                        case StatePhrase_:
                            _pushPhrase()
                            TokenState_ = StateIgnore_
                        break

                        case StateCBlock_:
                            if (TokenOBLvl_ > 0) {
                                TokenOBLvl_-- // close the block
                                _pushPhrase()
                                TokenState_ = StateIgnore_
                                return _phrases // return the block
                            } else {
                                logStderr(SHECodeSrc_.substring(0, SHECodeIdx_))
                                logStderr("Missing Open Block")
                                return
                            }
                        break
                    }
                }
            break

            case StateSQuote_:
                if (_char = parseSQuote(_char)) {
                    _pushChar()
                }
                if (TokenState_ != StateSQuote_) {
                    _pushWord()
                }
            break

            case StateDQuote_:
                if (_char = parseDQuote(_char)) {
                    _pushChar()
                }
                if (TokenState_ != StateDQuote_) {
                    _pushWord()
                }
            break
        }
        SHECodeIdx_++
    }
    _pushPhrase()
    return _phrases ? _phrases : []
}

function parseIgnore(_char) {
    switch (_char) {
        case TokenWSpace_:
        case TokenIndent_:
            return
        case TokenEscape_:
            ModeNoLine_ = true
            return
        case TokenNWLine_:
        case TokenCRLine_:
        case TokenEOLine_:
            if (! ModeNoLine_) {
                TokenState_ = StatePhrase_
            }
            return
        case TokenSQuote_:
            ModeNoLine_ = false
            TokenState_ = StateSQuote_
            return
        case TokenDQuote_:
            ModeNoLine_ = false
            TokenState_ = StateDQuote_
            return
        case TokenOBlock_:
            ModeNoLine_ = false
            TokenState_ = StateOBlock_
            return
        case TokenCBlock_:
            ModeNoLine_ = false
            TokenState_ = StateCBlock_
            return
        default:
            ModeNoLine_ = false
            TokenState_ = StateSingle_
            return _char
    }
}

function parseSingle(_char) {
    switch (_char) {
        case TokenWSpace_:
        case TokenIndent_:
            SingleOCnt_ = 0
            TokenState_ = StateIgnore_
            return
        case TokenNWLine_:
        case TokenCRLine_:
        case TokenEOLine_:
            SingleOCnt_ = 0
            TokenState_ = StatePhrase_
            return
        case TokenOBlock_:
            SingleOCnt_++
            return _char
        case TokenCBlock_:
            if (SingleOCnt_ > 0) { // close block is part of the single
                SingleOCnt_--
                return _char
            } else { // close a block
                TokenState_ = StateCBlock_
                return
            }
        default:
            return _char
    }
}

function parseSQuote(_char) {
	if (ModeEscape_) {
		ModeEscape_ = false
		return escChar(_char)
	}
    switch (_char) {
        case TokenSQuote_:
            TokenState_ = StateIgnore_
            return ""
        case TokenEscape_:
            ModeEscape_ = true
            return ""
        default:
            return _char
    }
}

function parseDQuote(_char) {
	if (ModeEscape_) {
		ModeEscape_ = false
		return escChar(_char)
	}
    switch (_char) {
        case TokenDQuote_:
            TokenState_ = StateIgnore_
            return ""
        case TokenEscape_:
            ModeEscape_ = true
            return ""
        default:
            return _char
    }
}

function escChar(_char) {
    switch (_char) {
        case "'":
            return String.fromCharCode(39) // single quote
        case '"':
            return String.fromCharCode(34) // double quote
        case "\\":
            return String.fromCharCode(92) // backslash
        case "/":
            return String.fromCharCode(47) // forwslash
        case "n":
            return String.fromCharCode(10) // newline
        case "r":
            return String.fromCharCode(13) // carriage return
        case "t":
            return String.fromCharCode(09) // horizontal tab
        case "b":
            return String.fromCharCode(08) // backspace
        case "f":
            return String.fromCharCode(12) // formfeed//useless
        case "v":
            return String.fromCharCode(11) // vertical tab//useless
        default:
            return _char
    }
}


// Eval Stacks
const StackArgs_ = new Stack() // command and args
const StackFcts_ = new Stack() // defined functions
const StackVars_ = new Stack() // defined variables
const StackBack_ = new Stack() // return value

// Eval Utils
// Env
function pushEnv() { // push a new env level and return the level
    const _result = StackBack_.length() + 1
    StackArgs_.push([])
    StackFcts_.push({})
    StackVars_.push({})
    StackBack_.push("")
    return _result
}

function popEnv() { // pop last env and return the last return value
    const _result = getBack()
    StackArgs_.pop()
    StackFcts_.pop()
    StackVars_.pop()
    StackBack_.pop()
    return _result
}

// Args
function getArgs() {
    return StackArgs_.get()
}

function getArgN(_n) {
    return getArgs()[_n]
}

function getArg0() {
    return getArgN(0)
}

function setArgs(_value) {
    return StackArgs_.set(_value)
}

function setArgN(_n, _value) {
    const _args = getArgs()
    _args[_n] = _value
    setArgs(_args)
    return getArgN(_n)
}

function setArg0(_value) {
    return setArgN(0, _value)
}

function evalArgs() {
    for (_n in getArgs()) {
        evalArgN(_n)
    }
    return getArgs()
}

function evalArgN(_n) {
    return setArgN(_n, evalAst(getArgN(_n)))
}

function evalArg0() {
    return evalArgN(0)
}

// Back
function getBack() {
    return StackBack_.get()
}
function setBack(_value) {
    return StackBack_.set(_value)
}

// Vars
function setVar(_var, _value) {
    let _vars = StackVars_.get()
    _vars[_var] = _value
    return StackVars_.set(_vars)
}

function getVar(_var) {
    let _back = ""
    let _stackvarsreversed = StackVars_.value().toReversed()
    for (_vars of _stackvarsreversed) { // try to find the var at any top down level
        if (_vars.hasOwnProperty(_var)) {
            _back = _vars[_var]
            break
        }
    }
    return _back
}


// Eval
function evalAst(_ast) {
    pushEnv()
    if (Array.isArray(_ast)) {
        for (_phrase of _ast) {
            setBack(evalAstPhrase(_phrase))
        }
    } else {
        setBack(_ast ? _ast : "")
    }
    return popEnv()
}

function evalAstPhrase(_phrase) {
    setArgs(_phrase)
    const _arg0 = evalArg0()
    const _args = getArgs()
    logFollow(_arg0)
    logFollow(_args)
    return execArg0(_arg0)
}


// Exec Reserved Functions
const ExecReserved_ = {
    ".echo":        execEcho,       // echo args...
    ".e":           execEcho,       // alias
    ".join":        execJoin,       // join separator args...
    ".j":           execJoin,       // alias
    ".set":         execSet,        // set value vars...
    ".!":           execSet,        // alias
    ".get":         execGet,        // get vars...
    ".@":           execGet,        // alias
    ".add":         execAdd,        // add/positive args...
    ".+":           execAdd,        // alias
    ".sub":         execSub,        // substact/negative args...
    ".-":           execSub,        // alias
    ".mul":         execMul,        // multiply args...
    ".*":           execMul,        // alias
    ".div":         execDiv,        // divide args...
    "./":           execDiv,        // alias
    ".mod":         execMod,        // modulo args...
    ".%":           execMod,        // alias
    ".pow":         execPow,        // power args...
    ".^":           execPow,        // alias
    ".sqr":         execSqr,        // squareroot args...
    ".x":           execSqr,        // alias
    ".min":         execMin,        // minimum args...
    ".<":           execMin,        // alias
    ".max":         execMax,        // maximum args...
    ".>":           execMax,        // alias
    ".avg":         execAvg,        // average args...
    ".|":           execAvg,        // alias
    ".true":        execTrue,       // true = "1"
    ".t":           execTrue,       // alias
    ".false":       execFalse,      // false = "0"
    ".f":           execFalse,      // alias
    ".ran":         execRan,        // random 0-1 or 0-arg1 or pick a random arg
    ".?":           execRan,        // alias
    ".h2d":         execH2D,        // hex to decimal
    ".#":           execH2D,        // alias
}


// Exec
function execArg0(_arg0) {
    // TODO check for custom functions first
    if (! ExecReserved_.hasOwnProperty(_arg0)) {
        logStderr("Unknown Arg0: " + _arg0)
        return _arg0
    }
    return ExecReserved_[_arg0]()
}

function execEcho() {
    evalArgs()
    let _back = ""
    _back = getArgs().slice(1).join(" ")
    logOutput(_back)
    return _back
}

function execJoin() {
    evalArgs()
    let _back = ""
    let _arg1 = getArgN(1) // separator
    if (notEmpty(_arg1)) {
        _back = getArgs().slice(2).join(_arg1)
    }
    return _back
}

function execSet() {
    evalArgs()
    let _back = ""
    let _arg1 = getArgN(1) // value
    if (notEmpty(_arg1)) {
        _back = _arg1
        for (_var of getArgs().slice(2)) {
            setVar(_var, _back)
        }
    }
    return _back
}

function execGet() {
    evalArgs()
    let _back = ""
    for (_var of getArgs().slice(1)) {
        _back = getVar(_var)
    }
    return _back
}

function execAdd() {
    return execMath2N(
        (_back, _arg1)  => {return Math.abs(_arg1)},
        (_back, _arg2n) => {return _back + _arg2n}
    )
}

function execSub() {
    return execMath2N(
        (_back, _arg1)  => {return 0 - Math.abs(_arg1)},
        (_back, _arg2n) => {return _back - _arg2n}
    )
}

function execMul() {
    return execMath2N(
        (_back, _arg1)  => {return _arg1},
        (_back, _arg2n) => {return _back * _arg2n}
    )
}

function execDiv() {
    return execMath2N(
        (_back, _arg1)  => {return _arg1},
        (_back, _arg2n) => {return _back / _arg2n}
    )
}

function execMod() {
    return execMath2N(
        (_back, _arg1)  => {return _arg1},
        (_back, _arg2n) => {return _back % _arg2n}
    )
}

function execPow() {
    return execMath2N(
        (_back, _arg1)  => {return _arg1},
        (_back, _arg2n) => {return Math.pow(_back, _arg2n)}
    )
}

function execSqr() {
    return execMath1N(
        (_back, _arg1n)  => {return Math.sqrt(_arg1n)}
    )
}

function execMin() {
    return execMath2N(
        (_back, _arg1)  => {return _arg1},
        (_back, _arg2n) => {return _back < _arg2n ? _back : _arg2n}
    )
}

function execMax() {
    return execMath2N(
        (_back, _arg1)  => {return _arg1},
        (_back, _arg2n) => {return _back > _arg2n ? _back : _arg2n}
    )
}

function execAvg() {
    return execMath2N(
        (_back, _arg1)  => {return _arg1},
        (_back, _arg2n) => {return (_back + _arg2n) / 2}
    )
}

function execH2D() {
    return execMath1N(
        (_back, _arg1n)  => {return parseInt(_arg1n, 16)}
    )
}

function execMath1N(_doarg1n) { // apply math functions depending of the number of arguments
    evalArgs()
    let _back = 0
    for (_arg1n of getArgs().slice(1)) {
        _back = _doarg1n(_back, notNumber(_arg1n) ? _arg1n : Number(_arg1n))
    }
    return _back.toString()
}

function execMath2N(_doarg1, _doarg2n) { // apply math functions depending of the number of arguments
    evalArgs()
    let _back = 0
    let _arg1 = getArgN(1) // first arg
    let _arg2 = getArgN(2) // has more args
    if (notEmpty(_arg1)) {
        if (notEmpty(_arg2)) { // math all
            _back = Number(_arg1)
            for (_arg2n of getArgs().slice(2)) {
                _back = _doarg2n(_back, notNumber(_arg2n) ? _arg2n : Number(_arg2n))
            }
        } else { // math one
            _back = _doarg1(_back, notNumber(_arg1) ? _arg1 : Number(_arg1))
        }
    }
    return _back.toString()
}

function execTrue() {
    return "1"
}

function execFalse() {
    return "0"
}

function execRan() {
    evalArgs()
    let _back = Math.random()
    let _arg1 = getArgN(1) // first arg
    let _arg2 = getArgN(2) // has more args
    if (notEmpty(_arg1)) {
        if (notEmpty(_arg2)) { // pick a random arg
            let _n = Math.floor(Math.random() * (getArgs().length - 1)) + 1
            _back = getArgN(_n)
        } else { // random (floor) from 1-arg1 (included)
            _back = Math.floor(Math.random() * Number(_arg1)) + 1
        }
    }
    return _back.toString()
}



// Main
logAction("Source:")
logStdout(SHECodeSrc_)
logAction("Parsing ...")
const SHECodeAst_ = parseSource()
logAction("Object:")
for (_phrase of SHECodeAst_) {
    logStdout(JSON.stringify(_phrase))
}
logAction("Result:")
logResult("<" + JSON.stringify(evalAst(SHECodeAst_)) + ">")
