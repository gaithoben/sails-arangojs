module.exports = (globalId, keyProps, saveToCache) => {
  return {
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // STATIC METHODS
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    globalId,
    keyProps,
    saveToCache,
    [`Available${globalId}s`]: {},
    [`get${globalId}`]: async function (params, dsName) {
      try {
        const { id } = params || {};

        if (saveToCache) {
          if (dsName) {
            if (
              id &&
              global[`${globalId}Object`][`Available${globalId}s`][
                `${dsName}/${id}`
              ]
            ) {
              return global[`${globalId}Object`][`Available${globalId}s`][
                `${dsName}/${id}`
              ];
            }
          } else {
            if (
              id &&
              global[`${globalId}Object`][`Available${globalId}s`][id]
            ) {
              return global[`${globalId}Object`][`Available${globalId}s`][id];
            }
          }
        }

        const obj = await global[`${globalId}Object`][`find${globalId}`](
          params,
          dsName
        );

        if (obj && obj.id) {
          if (saveToCache) {
            if (dsName) {
              global[`${globalId}Object`][`Available${globalId}s`][
                `${dsName}/${obj.id}`
              ] = obj;
            } else {
              global[`${globalId}Object`][`Available${globalId}s`][
                obj.id
              ] = obj;
            }
          }
        } else {
          throw new Error(`${globalId} not available`);
        }

        return obj;
      } catch (error) {
        throw error;
      }
    },

    [`create${globalId}`]: async function (params, dsName) {
      try {
        if (params.Email) {
          params.Email = `${params.Email}`.toLocaleLowerCase().trim();
        }

        const doc = await global[`${globalId}Object`][`find${globalId}`](
          {
            id: params.id,
          },
          dsName
        );

        if (doc) {
          throw new Error(`Document with same id already exists`);
        }

        let newdoc;

        if (dsName) {
          newdoc = await global[`_${globalId}`](dsName).create(params).fetch();
        } else {
          newdoc = await global[globalId].create(params).fetch();
        }

        if (newdoc) {
          if (saveToCache) {
            if (dsName) {
              global[`${globalId}Object`][`Available${globalId}s`][
                newdoc.id
              ] = null;
            } else {
              global[`${globalId}Object`][`Available${globalId}s`][
                `${dsName}/${newdoc.id}`
              ] = null;
            }
          }
          const doc = await global[`${globalId}Object`][`get${globalId}`](
            {
              ...newdoc,
            },
            dsName
          );

          return doc;
        }
        return null;
      } catch (error) {
        throw error;
      }
    },

    [`find${globalId}`]: async function (params, dsName) {
      try {
        const { id, ...otherprops } = params || {};

        let doc;
        if (id) {
          if (dsName) {
            doc = await global[`_${globalId}`](dsName).findOne({ id: id });
          } else {
            doc = await global[`${globalId}`].findOne({ id: id });
          }
        }

        for (let prop in otherprops) {
          if (otherprops[prop] && !doc) {
            if (dsName) {
              doc = await global[`_${globalId}`](dsName).findOne({
                [prop]: otherprops[prop],
              });
            } else {
              doc = await global[`${globalId}`].findOne({
                [prop]: otherprops[prop],
              });
            }
          }
        }

        if (doc) {
          return global[`${globalId}Object`].initialize(doc);
        }

        return null;
      } catch (error) {
        throw error;
      }
    },

    initialize: function initialize(doc, dsName) {
      try {
        if (doc instanceof global[`${globalId}Object`]) {
          return doc;
        }

        let docObj;
        if (doc) {
          if (dsName) {
            docObj = new global[`${globalId}Object`](dsName);
          } else {
            docObj = new global[`${globalId}Object`]();
          }

          for (let key in doc) {
            docObj[key] = doc[key];
          }

          let props = {};
          for (let prop of global[`${globalId}Object`].keyProps) {
            props[prop] = doc[prop];
          }

          docObj.constructor.prototype.keyProps = {
            ...props,
            id: doc.id || doc._key,
            _id: doc._id,
          };
        }

        return docObj;
      } catch (error) {
        throw error;
      }
    },

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // PROTOTYPES
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  };
};