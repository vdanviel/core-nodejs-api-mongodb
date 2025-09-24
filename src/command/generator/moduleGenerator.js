import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

class ModuleGenerator {

    #modelPath;
    #controllerPath;
    #routePath;
    #templateFileEmptyPath;
    #templateFileFilledPath;

    constructor() {
        this.#modelPath = path.dirname(fileURLToPath(import.meta.url)) + "/../../model/";
        this.#controllerPath = path.dirname(fileURLToPath(import.meta.url)) + "/../../controller/";
        this.#routePath = path.dirname(fileURLToPath(import.meta.url)) + "/../../router/";
        this.#templateFileEmptyPath = path.dirname(fileURLToPath(import.meta.url)) + "/../template/empty/";
        this.#templateFileFilledPath = path.dirname(fileURLToPath(import.meta.url)) + "/../template/complete/";
    }

    #validateModuleName(name) {

        if (fs.existsSync(path.join(this.#modelPath, `${name}.js`))) {
            throw new Error("Module already exists.");
        }
        
    }

    async #generateFile(templatePath, destPath, replacements) {
        let content = await fs.promises.readFile(templatePath, 'utf8');
        for (const [key, value] of Object.entries(replacements)) {
            content = content.replaceAll(key, value);
        }
        await fs.promises.writeFile(destPath, content, {flag: 'wx'});
    }

    async generate(name, emptyOrFull) {
        try {
            this.#validateModuleName(name);

            let templatePath;
            if (emptyOrFull === 'empty') {
                templatePath = this.#templateFileEmptyPath;
            } else if (emptyOrFull === 'complete') {
                templatePath = this.#templateFileFilledPath;
            } else {
                throw new Error("The second parameter must be 'empty' or 'complete', " + emptyOrFull + " given.");
            }

            console.log(`🚀 Creating ${emptyOrFull} module (${name})...`);

            let moduleName = name.toLowerCase();
            let titleModuleName = name.charAt(0).toUpperCase() + name.slice(1);

            const replacements = {
                "__ModuleName__": moduleName,
                "__TitleModuleName__": titleModuleName
            };

            await this.#generateFile(
                path.join(templatePath, "modelTemplate.js"),
                path.join(this.#modelPath, `${moduleName}.js`),
                replacements
            );
            await this.#generateFile(
                path.join(templatePath, "controllerTemplate.js"),
                path.join(this.#controllerPath, `${moduleName}Controller.js`),
                replacements
            );
            await this.#generateFile(
                path.join(templatePath, "routerTemplate.js"),
                path.join(this.#routePath, `${moduleName}Router.js`),
                replacements
            );

            console.log(`✅ Module (${moduleName}) created with success!`);
        } catch (error) {
            throw error;
        }
    }

    listModules() {
        return fs.readdirSync(this.#modelPath)
            .filter(file => file.endsWith('.js'))
            .map(file => file.replace('.js', ''));
    }

    async remove(name) {
        try {
            const files = [
                path.join(this.#modelPath, `${name.toLowerCase()}.js`),
                path.join(this.#controllerPath, `${name.toLowerCase()}Controller.js`),
                path.join(this.#routePath, `${name.toLowerCase()}Router.js`)
            ];
            for (const file of files) {
                if (fs.existsSync(file)) {
                    await fs.promises.unlink(file);
                }
            }
            console.log(`🗑️ Module (${name.toLowerCase()}) removed.`);
        } catch (error) {
            throw error;
        }

    }
}


export { ModuleGenerator };