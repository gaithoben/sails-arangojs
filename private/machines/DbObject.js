function getObject(globalId) {
  return String(global[`${globalId}Dbo`]);
}

module.exports = ({ globalId, keyProps, modelDefaults, modelAttributes }) => {
  const globalid = `${globalId}`.toLocaleLowerCase();
  const methods = () => ({
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // STATIC METHODS
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    globalId: `"${globalId}"`,
    keyProps: JSON.stringify(keyProps),
    modelDefaults: JSON.stringify(modelDefaults || {}),
    modelAttributes: JSON.stringify(modelAttributes || {}),

    create: function (...params) {
      const validateParams = (docParams) => {
        const attributes = globalIdDbo.modelAttributes;
        for (let key in attributes) {
          const type =
            attributes[key].type === 'json' ? 'object' : attributes[key].type;
          const required = attributes[key].required;

          if (docParams[key] && typeof docParams[key] !== type) {
            throw new Error(
              `${key} attribute in ${globalIdDbo.globalId} should be of type ${type}`
            );
          }

          if (
            docParams[key] !== 0 &&
            docParams[key] !== false &&
            !docParams[key] &&
            required
          ) {
            throw new Error(
              `${key} attribute in ${globalIdDbo.globalId} is required`
            );
          }
        }

        return true;
      };

      if (params.length > 2) {
        const docParams = {
          ...globalIdDbo.modelDefaults,
          ...params[2],
          createdAt: Date.now(),
        };

        validateParams(docParams);

        params[2] = docParams;
        params[3] = { returnNew: true };
      } else {
        if (Array.isArray(params[0])) {
          throw new Error(`Arrays are not supported`);
        } else {
          const docParams = {
            ...globalIdDbo.modelDefaults,
            ...params[0],
            createdAt: Date.now(),
          };

          validateParams(docParams);

          params[0] = docParams;
          params[1] = { returnNew: true };
        }
      }

      const doc = db.globalid.insert(...params).new;
      const docObj = globalIdDbo.initialize(doc);
      if (typeof docObj.onGetOne === 'function') {
        docObj.onGetOne();
      }
      return docObj;
    },

    getDocument: function (params) {
      const doc = db.globalid.document(params);
      const docObj = globalIdDbo.initialize(doc);
      if (typeof docObj.onGetOne === 'function') {
        docObj.onGetOne();
      }

      return docObj;
    },

    firstExample: function (params) {
      const doc = db.globalid.firstExample(params);
      if (doc) {
        const docObj = globalIdDbo.initialize(doc);
        if (typeof docObj.onGetOne === 'function') {
          docObj.onGetOne();
        }
        return docObj;
      }
      return null;
    },

    initialize: function (doc) {
      if (doc instanceof globalIdDbo) {
        //Re Initialize
        doc.reInitialize(doc);
        return doc;
      }

      const obj = new globalIdDbo();
      for (let key of Object.keys(doc)) {
        obj[key] = doc[key];
        obj.id = doc._key;
      }

      Object.defineProperty(obj, 'globalId', {
        get: () => {
          return globalIdDbo.globalId;
        },
      });

      Object.defineProperty(obj, 'instanceName', {
        get: () => {
          return 'globalIdDbo';
        },
      });

      Object.defineProperty(obj, 'keyProps', {
        get: () => {
          return obj.getKeyProps();
        },
      });

      if (typeof obj.afterInitialize === 'function') {
        obj.afterInitialize();
      }

      return obj;
    },

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // PROTOTYPES
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  });

  const prototypes = () => ({
    getKeyProps: function getKeyProps() {
      let props = {};
      for (let prop of this.constructor.keyProps) {
        props[prop] = this[prop];
      }

      return {
        ...props,
        id: this._key,
        _id: this._id,
      };
    },
    reInitialize: function (doc) {
      for (let key of Object.keys(doc)) {
        this[key] = doc[key];
      }
    },
    update: function (callback) {
      if (typeof callback === 'function') {
        const updateValues = callback(this);
        const updatedDoc = db._update(
          this,
          { ...updateValues, updatedAt: Date.now() },
          { returnNew: true }
        ).new;
        this.reInitialize(updatedDoc);
      } else if (typeof callback === 'object') {
        const updatedDoc = db._update(
          this,
          { ...callback, updatedAt: Date.now() },
          { returnNew: true }
        ).new;
        this.reInitialize(updatedDoc);
      } else {
        throw new Error(`Dbo update function expects a callback`);
      }
    },
  });

  Object.assign(global[`${globalId}Dbo`], methods());
  Object.assign(global[`${globalId}Dbo`].prototype, prototypes());

  const objString = `${getObject(globalId)}\n`;

  let methodsString = '';
  for (let key in global[`${globalId}Dbo`]) {
    methodsString = `${methodsString}${key}: ${String(
      global[`${globalId}Dbo`][key]
    )},\n`;
  }

  methodsString = `${methodsString}`.replace(/globalIdDbo/g, `${globalId}Dbo`);
  methodsString = `${methodsString}`.replace(/globalid/g, `${globalid}`);

  methodsString = `const ${globalId}StaticMethods = {\n${methodsString}\n}\n\nObject.assign(${globalId}Dbo, ${globalId}StaticMethods);\n`;

  let protypesString = '';
  for (let key in global[`${globalId}Dbo`].prototype) {
    protypesString = `${protypesString}${globalId}Dbo.prototype.${key} = ${String(
      global[`${globalId}Dbo`].prototype[key]
    )}\n`;
  }

  return `${objString}${methodsString}${protypesString}`;
};
