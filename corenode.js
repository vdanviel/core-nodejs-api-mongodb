// ferramenta command line para gerar arquitetura de modulos de forma automatica e mais

import { ModuleGenerator } from "./src/command/generator/moduleGenerator.js";
import { Command } from 'commander';

const program = new Command();

//module commands...
const moduleCommand = program.command('module')
  .description('Module commands');

// gerar modulo
moduleCommand.command('generate <name>')
  .description('Generate new module')
  .argument('<name>', 'name of the module')
  .option('--mode <mode>', 'mode of the module (e.g., empty or complete)')
  .action((name, opt) => {

    const generator = new ModuleGenerator();
    
    generator.generate(name, opt || 'empty');

  });

// remover modulo
moduleCommand.command('remove') // Mudança aqui! De 'remove' para 'rm'
  .description('Remove an existing module')
  .argument('<name>', 'name of the module to remove')
  .action((name) => {

    const generator = new ModuleGenerator();

    // A lógica de remoção permanece a mesma, apenas o comando mudou
    generator.remove(name); 

  });

// listar modulos
moduleCommand.command('list')
  .description('List modules')
  .action(async () => {

    const generator = new ModuleGenerator();

    console.log(await generator.listModules())

  });

program.parse();