/*global fixture test document*/
import ReactSelector from '../lib';
import initTestServer from './server';
import { ClientFunction } from 'testcafe';

initTestServer();

fixture('ReactJS TestCafe plugin').page('http://localhost:1355');

test('Should throw exception for non-valid selectors', async t => {
    for (var selector of [null, false, void 0, {}, 42]) {
        try {
            await ReactSelector(selector);
        }
        catch (e) {
            await t.expect(e.errMsg).contains(`Selector option is expected to be a string, but it was ${typeof selector}.`);
        }
    }
});

test('Should get DOM node by react selector', async t => {
    var app = await ReactSelector('App');

    var listItem1 = ReactSelector('ListItem').nth(0);
    var listItem2 = ReactSelector('ListItem').nth(1);

    await t
        .expect(await app.id).eql('app')
        .expect(await listItem1.id).eql('l1-item1')
        .expect(await listItem2.id).eql('l1-item2');
});

test('Should get DOM node by composite selector', async t => {
    var listItem1 = ReactSelector('List ListItem');
    var listItem2 = ReactSelector('List ListItem').nth(1);

    await t
        .expect(await listItem1.id).eql('l1-item1')
        .expect(await listItem2.id).eql('l1-item2');
});

test('Should not get DOM node for stateless component', async t => {
    var stateless = await ReactSelector.with({ timeout: 100 })('StatelessComponent');

    await t.expect(stateless).notOk();
});


test('Should not get DOM node for element outside react component tree ', async t => {
    await t.expect(await ReactSelector.with({ timeout: 100 })('figure')).notOk();
});


test('Should get component state', async t => {
    var listItem1React  = await ReactSelector('ListItem').getReact();
    var listItem2React  = await ReactSelector('ListItem').nth(1).getReact();
    var listItem3       = await ReactSelector('ListItem').nth(2);
    var listItem3ItemId = listItem3.getReact(({ state }) => state.itemId);

    var tagReact = await ReactSelector('ListItem p').getReact();

    await t
        .expect(listItem1React.state).eql({ itemId: 'l1-item1' })
        .expect(listItem2React.state).eql({ itemId: 'l1-item2' })

        .expect(listItem3ItemId).eql('l1-item3')

        .expect(tagReact).notOk();
});

test('Should get component props', async t => {
    var listItem1React = await ReactSelector('ListItem').getReact();
    var listItem2React = await ReactSelector('ListItem').nth(1).getReact();
    var listItem3      = await ReactSelector('ListItem').nth(2);
    var listItem3Id    = listItem3.getReact(({ props }) => props.id);

    await t
        .expect(listItem1React.props).eql({ id: 'l1-item1' })
        .expect(listItem2React.props).eql({ id: 'l1-item2' })
        .expect(listItem3Id).eql('l1-item3');
});

test('Version of React js is not supported', async t => {
    await ClientFunction(() => {
        const reactRoot         = document.querySelector('[data-reactroot]');
        const internalReactProp = Object.keys(reactRoot).filter(prop => /^__reactInternalInstance/.test(prop))[0];

        delete reactRoot[internalReactProp];
    })();

    try {
        await ReactSelector('App');
    }
    catch (e) {
        await t.expect(e.errMsg).contains('testcafe-react-selectors supports React version 15.x and newer');
    }
});

test('There is no React on the tested page', async t => {
    await t.navigateTo('./noReact');

    try {
        await ReactSelector('body');
    }
    catch (e) {
        await t.expect(e.errMsg).contains('testcafe-react-selectors supports React version 15.x and newer');
    }
});
