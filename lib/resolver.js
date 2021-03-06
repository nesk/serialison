import {each, transform, isString} from './utils';

export class Resolver {

    constructor(mapperInstance, options = {})
    {
        this.options = Object.assign({
            maxNestingDepth: 4,
            stripLinksProperty: true,
            resourceTransformers: []
        }, options);

        this.mapper = mapperInstance;

        this.nestingPath = [];
    }

    /**
     * Returns the resource(s) once all the links are resolved
     */
    resolve(resourceKey, resources)
    {
        if (this.nestingPath.length < this.options.maxNestingDepth) {
            // If we have a collection of resources, call recursively the resolve() method for each resource.
            if (Array.isArray(resources)) {
                for (let {key: resourceIndex, value: resource} of each(resources)) {
                    resources[resourceIndex] = this.resolve(resourceKey, resource);
                }
            }

            // Link the relationships of the current resource
            else if (resources) {
                this.nestingPath.push(resourceKey);

                for (let {key: relationshipKey, value: relationship} of each(resources.links || {})) {
                    let relatedResources = this.link(relationshipKey, relationshipKey, relationship);

                    if (relatedResources != null) {
                        resources[relationshipKey] = relatedResources;
                    }
                }

                resources = transform(resources, [this.defaultTransformer()].concat(this.options.resourceTransformers));

                this.nestingPath.pop();
            }
        }

        return resources;
    }

    /**
     * Returns the related resource(s) once they have been resolved
     */
    link(relationshipKey, relationshipType, relationships)
    {
        // If the relationship contains an array of IDs, call recursively the link method() for each ID.
        if (Array.isArray(relationships)) {
            return this.linkMultipleIds(relationshipKey, relationshipType, relationships);
        }

        // If the relationship is not a string, assume it's a resource object.
        else if (!isString(relationships)) {
            // Get the real type of the resource
            let relationshipType = relationships.type || relationshipKey;

            // Only one ID
            if (relationships.id) {
                return this.link(relationshipKey, relationshipType, relationships.id.toString());
            }

            // Multiples IDs
            else if (relationships.ids) {
                return this.linkMultipleIds(relationshipKey, relationshipType, relationships);
            }

            return null;
        }

        // If the relationship is a string, we can retrieve the resource.
        else {
            let relationshipPath = this.nestingPath.concat(relationshipKey).join('.'),
                resource = this.mapper.getResource(relationshipPath, relationshipType, relationships);

            return this.resolve(relationshipKey, resource);
        }
    }

    /**
     * Returns the related collection of resources
     */
    linkMultipleIds(relationshipKey, relationshipType, relationships)
    {
        var resources = [];

        for (let {value: relationshipID} of each(relationships)) {
            let resource = this.link(relationshipKey, relationshipType, relationshipID.toString());

            if (resource) {
                resources.push(resource);
            }
        }

        return resources.length ? resources : null;
    }

    /**
     * Returns the default transformer used to strip the `links` property of each resource
     */
    defaultTransformer()
    {
        var self = this;

        return function(resource) {
            if (self.options.stripLinksProperty) {
                delete resource.links;
            }

            return resource;
        };
    }

};
