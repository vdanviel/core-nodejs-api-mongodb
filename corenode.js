// ferramenta command line para gerar arquitetura de modulos de forma automatica e mais

import { ModuleGenerator } from "./src/command/generator/moduleGenerator.js";
import { Command } from "commander";

const program = new Command();

// gerar modulo
program.command('generate:module')
  .description('Generate new module')
  .argument('<name>', 'name of the module')
  .option('--mode <mode>', 'mode of the module (e.g., empty or complete)')
  .action((name, options) => {

    const generator = new ModuleGenerator();
    
    generator.generate(name, options.mode || 'empty');

  });

// remover modulo
program.command('remove:module')
  .description('Remove an existing module')
  .argument('<name>', 'name of the module to remove')
  .action((name) => {

    const generator = new ModuleGenerator();

    generator.remove(name);

  });

// listar modulos
program.command('list:module')
  .description('List modeules')
  .action(async () => {

    const generator = new ModuleGenerator();

    console.log(await generator.listModules())

  });

program.parse();