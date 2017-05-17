import {join} from 'path';
import fs from 'mz/fs';
import camel from 'camelcase';
import toml from 'toml';
import tomlify from 'tomlify-j0.4';
import getPackages from './getPackages';
import sortAscending from './sortAscending';

/* External repositories, so the data is added manually */

const database = toml.parse(`
[autoprefixer]
shortDescription = "Removes outdated vendor prefixes"
longDescription = "Removes unnecessary prefixes based on the \`browsers\` option. Note that *by default*, **it will not add new prefixes** to the CSS file."
inputExample = """
.box {
    -moz-border-radius: 10px;
    border-radius: 10px;
    display: flex;
}
"""
outputExample = """
.box {
    border-radius: 10px;
    display: flex;
}
"""
source = "https://github.com/postcss/autoprefixer"
safe = 2.0 # Changes semantics
shortName = "autoprefixer"

[postcss-calc]
shortDescription = "Reduces CSS calc expressions"
longDescription = "Reduces CSS \`calc\` expressions whereever possible, ensuring both browser compatibility and compression."
inputExample = """
.box {
    width: calc(2 * 100px);
}
"""
outputExample = """
.box {
    width: 200px;
}
"""
source = "https://github.com/postcss/postcss-calc"
shortName = "calc"
`);

function shortName (pkgName) {
    return camel(pkgName.replace(/^(postcss|cssnano-util)-/, ''));
}

getPackages().then(packages => {
    return Promise.all(packages.map((pkg) => {
        return fs.readFile(join(pkg, 'metadata.toml'), 'utf8').then(contents => {
            const metadata = toml.parse(contents);
            const pkgJson = require(join(pkg, 'package.json'));
            const pkgName = pkgJson.name;
            database[pkgName] = Object.assign({}, metadata, {
                source: `${pkgJson.homepage}/tree/master/packages/${pkgName}`,
                shortDescription: pkgJson.description,
                shortName: shortName(pkgName),
            });
        }).catch(() => {});
    }, {})).then(() => {
        const sortedKeys = Object.keys(database).sort(sortAscending);
        const sorted = sortedKeys.reduce((db, key) => {
            const value = database[key];
            db[key] = value;
            return db;
        }, {});
        return fs.writeFile(
            join(__dirname, '../metadata.toml'),
            tomlify(sorted)
        );
    });
});
