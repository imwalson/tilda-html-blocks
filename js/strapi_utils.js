axios.defaults.timeout = 60000;

const qs = Qs;
const defaults = {
  url: "http://localhost:1337",
  prefix: "/api",
  axiosOptions: {},
};

class Strapi {
  constructor(options) {
    const _options = {
      ...defaults,
      ...options,
    };

    this.options = {
      ..._options,
      url: _options?.url,
      prefix: _options?.prefix,
    };

    // create axios instance
    this.axios = axios.create({
      baseURL: `${this.options.url}${this.options.prefix}`,
      paramsSerializer: qs.stringify,
      withCredentials: true,
      ...this.options.axiosOptions,
    });

    // Synchronize token before each request
    this.axios.interceptors.request.use((config) => {
      const token = this.getToken();
      const oldHeaders = config?.headers?.common || {};
      const headers = {
        ...oldHeaders,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const newConfig = {
        ...config,
        headers,
      };

      return newConfig;
    });

    // Add a 401 response interceptor
    this.axios.interceptors.response.use(
      function (response) {
        return response;
      },
      function (error) {
        console.log(error);
        if (401 === error.response.status) {
          console.error("Your session has expired.");
          return Promise.reject("Unauthorized");
        } else {
          return Promise.reject(error);
        }
      }
    );
  }

  // Basic axios request
  async request(method, url, axiosConfig = {}) {
    try {
      const response = await this.axios.request({
        method,
        url,
        ...axiosConfig,
      });
      return response.data;
    } catch (error) {
      console.error(error);
      if (!error.response) {
        throw {
          data: null,
          error: {
            status: 500,
            name: "UnknownError",
            message: error.message,
            details: error,
          },
        };
      } else {
        throw error.response.data;
      }
    }
  }

  // Get a list of {content-type} entries
  find(contentType, params = {}) {
    return this.request("get", `/${contentType}`, {
      params,
    });
  }

  // Get a specific {content-type} entry
  findOne(contentType, id, params = {}) {
    return this.request("get", `/${contentType}/${id}`, {
      params,
    });
  }

  // Create a {content-type} entry
  create(contentType, data = {}, params = {}) {
    return this.request("post", `/${contentType}`, {
      data: {
        data,
      },
      params,
    });
  }

  // Update a specific entry
  update(contentType, id, data = {}, params = {}) {
    return this.request("put", `/${contentType}/${id}`, {
      data: {
        data,
      },
      params,
    });
  }

  // Delete en entry
  delete(contentType, id, params = {}) {
    return this.request("delete", `/${contentType}/${id}`, {
      params,
    });
  }

  /**
   * Retrieve token from chosen storage
   *
   * @returns string | null
   */
  getToken() {
    if (isBrowser()) {
      const token = window.localStorage.getItem("jwt");
      if (typeof token === "undefined") return null;
      return token;
    }

    return null;
  }

  /**
   * Remove token from chosen storage (Cookies or Local)
   *
   * @returns void
   */
  removeToken() {
    if (isBrowser()) {
      window.localStorage.removeItem("jwt");
      window.localStorage.removeItem("username");
      window.localStorage.removeItem("userInfo");
    }
  }
}

function isBrowser() {
  return typeof window !== "undefined";
}

function parseCollection(collection) {
  /*
	 If collection.data is undefined, this must be a dynamic zone, 
	 so we set data to collection instead of collection.data
	*/
  const data = collection.data || collection;

  const res = data.map((entity) => {
    const obj = {
      id: entity.id,
    };

    /*
		 If entity.attributes is undefined, this mist be a component,
		 so we create an attributes field on the object and set it to the 
		 object itself.

		 This is done so the component is compatible with the parsing logic below
		 that was written for the standard format.
		*/
    if (!entity.attributes) {
      entity = {
        attributes: entity,
      };
    }

    const attributes = Object.getOwnPropertyNames(entity.attributes);

    attributes.forEach((attr) => {
      if (entity.attributes[attr] == null) {
        obj[attr] = null;
      } else {
        obj[attr] = strapiParse(entity.attributes[attr]);

        /*
				 If the attribute is a one-choice Strapi relationship, and the 
				 relationship is not set, the format is
				 
				  {
				    data: null
				  }

				  In this case, we just set the property to null.
				*/
        if (entity.attributes[attr].data === null) {
          obj[attr] = null;
        }
      }
    });

    return obj;
  });

  return res;
}

function parseSingle(entity) {
  if (!entity.data) return entity;
  const attributes = Object.getOwnPropertyNames(entity.data.attributes);
  const obj = {
    id: entity.data.id,
  };

  attributes.forEach((attr) => {
    const attrValue = entity.data.attributes[attr];
    if (attrValue == null) {
      obj[attr] = null;
    } else {
      obj[attr] = strapiParse(attrValue);
      /*
			  If the attribute is a one-choice Strapi relationship, and the 
			  relationship is not set, the format is
			  
			  {
			    data: null
			  }

			  In this case, we just set the property to null.
			*/
      if (attrValue?.data === null) {
        obj[attr] = null;
      }
    }
  });

  return obj;
}

function strapiParse(strapiResponse) {
  if (!strapiResponse) return null;

  if (Array.isArray(strapiResponse.data)) {
    return parseCollection(strapiResponse);
  } else if (Array.isArray(strapiResponse)) {
    return parseCollection(strapiResponse);
  }

  return parseSingle(strapiResponse);
}

function isErrorWithMessage(error) {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  );
}

function isStrapiError(error) {
  return (
    typeof error === "object" &&
    error !== null &&
    "data" in error &&
    "error" in error &&
    typeof error.error === "object" &&
    error.error !== null &&
    "message" in error.error &&
    "status" in error.error
  );
}

function toErrorWithMessage(maybeError) {
  if (isErrorWithMessage(maybeError)) return maybeError;
  if (isStrapiError(maybeError)) return new Error(maybeError.error.message);

  try {
    return new Error(JSON.stringify(maybeError));
  } catch {
    // fallback in case there's an error stringifying the maybeError
    // like with circular references for example.
    return new Error(String(maybeError));
  }
}

function getApiErrorMessage(error) {
  return toErrorWithMessage(error).message;
}
