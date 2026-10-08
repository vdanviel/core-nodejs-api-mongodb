import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CommandUtil } from '../CommandUtil.js';

class ModuleGenerator {

    _modelPath;
    _controllerPath;
    _routePath;
    _templateFileEmptyPath;
    _templateFileFilledPath;

    constructor() {
        this._modelPath = path.dirname(fileURLToPath(import.meta.url)) + "/../../model/";
        this._controllerPath = path.dirname(fileURLToPath(import.meta.url)) + "/../../controller/";
        this._routePath = path.dirname(fileURLToPath(import.meta.url)) + "/../../router/";
        this._templateFileEmptyPath = path.dirname(fileURLToPath(import.meta.url)) + "/../template/module/empty/";
        this._templateFileFilledPath = path.dirname(fileURLToPath(import.meta.url)) + "/../template/module/complete/";
    }

    _validateModuleName(name) {

        if (fs.existsSync(path.join(this._modelPath, `${name}.js`))) {
            throw new Error("Module already exists.");
        }
        
    }

    async _generateFile(templatePath, destPath, replacements) {
        let content = await fs.promises.readFile(templatePath, 'utf8');
        for (const [key, value] of Object.entries(replacements)) {
            content = content.replaceAll(key, value);
        }
        await fs.promises.writeFile(destPath, content, {flag: 'wx'});
    }

    async generate(name, emptyOrFull) {
        try {
            this._validateModuleName(name);

            let templatePath;
            if (emptyOrFull === 'empty') {
                templatePath = this._templateFileEmptyPath;
            } else if (emptyOrFull === 'complete') {
                templatePath = this._templateFileFilledPath;
            } else {
                throw new Error("The second parameter must be 'empty' or 'complete', " + emptyOrFull + " given.");
            }

            console.log(`🚀 Creating ${emptyOrFull} module (${name})...`);

            let moduleName = CommandUtil.camelize(name, false);
            let titleModuleName = CommandUtil.camelize(name, true);

            const replacements = {
                "__ModuleName__": moduleName,
                "__TitleModuleName__": titleModuleName
            };

            await this._generateFile(
                path.join(templatePath, "modelTemplate.js"),
                path.join(this._modelPath, `${titleModuleName}.js`),
                replacements
            );
            await this._generateFile(
                path.join(templatePath, "controllerTemplate.js"),
                path.join(this._controllerPath, `${titleModuleName}Controller.js`),
                replacements
            );
            await this._generateFile(
                path.join(templatePath, "routerTemplate.js"),
                path.join(this._routePath, `${titleModuleName}Router.js`),
                replacements
            );

            console.log(`✅ Module (${titleModuleName}) created with success!`);
        } catch (error) {
            throw error;
        }
    }

    listModules() {
        return fs.readdirSync(this._modelPath)
            .filter(file => file.endsWith('.js'))
            .map(file => file.replace('.js', ''));
    }

    async remove(name) {
        try {
            const files = [
                path.join(this._modelPath, `${name.toLowerCase()}.js`),
                path.join(this._controllerPath, `${name.toLowerCase()}Controller.js`),
                path.join(this._routePath, `${name.toLowerCase()}Router.js`)
            ];
            for (const file of files) {
                if (fs.existsSync(file)) {
                    await fs.promises.unlink(file);
                }
            }
            console.log(`🗑️  Module (${name.toLowerCase()}) removed.`);
        } catch (error) {
            throw error;
        }

    }
}


export { ModuleGenerator };