'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

require('slate');

var _utils = require('../utils');

/**
 * Create a schema definition with rules to normalize lists
 */
function normalizeNode(opts) {
    return function (node, next) {
        return joinAdjacentLists(opts, node, next);
    };
}

/**
 * A rule that joins adjacent lists of the same type
 */
function joinAdjacentLists(opts, node, next) {
    if (node.object !== 'document' && node.object !== 'block') {
        return next();
    }

    var invalids = node.nodes.map(function (child, i) {
        if (!(0, _utils.isList)(opts, child)) return null;
        var nextNode = node.nodes.get(i + 1);
        if (!nextNode || !(0, _utils.isList)(opts, nextNode) || !opts.canMerge(child, nextNode)) {
            return null;
        }

        return [child, nextNode];
    }).filter(Boolean);

    if (invalids.isEmpty()) {
        return next();
    }

    /**
     * Join the list pairs
     */
    // We join in reverse order, so that multiple lists folds onto the first one
    return function (change) {
        invalids.reverse().forEach(function (pair) {
            var _pair = _slicedToArray(pair, 2),
                first = _pair[0],
                second = _pair[1];

            var updatedSecond = change.value.document.getDescendant(second.key);

            // eslint-disable-next-line no-shadow
            change.withoutNormalizing(function (change) {
                updatedSecond.nodes.forEach(function (secondNode, index) {
                    change.moveNodeByKey(secondNode.key, first.key, first.nodes.size + index);
                });

                change.removeNodeByKey(second.key);
            });
        });
    };
}

exports.default = normalizeNode;