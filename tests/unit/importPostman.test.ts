import { strict as assert } from 'assert';
import { convertPostmanToCollection, isPostmanCollection } from '../../src/services/importPostman';

suite('importPostman', () => {
  suite('isPostmanCollection', () => {
    test('recognizes a valid Postman collection shape', () => {
      assert.ok(isPostmanCollection({ info: { name: 'X' }, item: [] }));
    });

    test('rejects data without info.name', () => {
      assert.ok(!isPostmanCollection({ info: {}, item: [] }));
    });

    test('rejects data without an item array', () => {
      assert.ok(!isPostmanCollection({ info: { name: 'X' } }));
    });
  });

  suite('convertPostmanToCollection — body mode mapping', () => {
    test('maps mode "urlencoded" from body.urlencoded (not body.formdata)', () => {
      const collection = convertPostmanToCollection({
        info: { name: 'Coll' },
        item: [
          {
            name: 'Req',
            request: {
              method: 'POST',
              url: 'https://api.example.com/x',
              body: {
                mode: 'urlencoded',
                urlencoded: [{ key: 'a', value: '1' }, { key: 'b', value: '2', disabled: true }],
              },
            },
          },
        ],
      });
      const body = collection.requests[0].request.body;
      assert.equal(body.type, 'form-data');
      assert.equal(body.formEncoding, 'urlencoded');
      assert.equal(body.formData?.length, 2);
      assert.equal(body.formData?.[0].key, 'a');
      assert.equal(body.formData?.[1].enabled, false);
    });

    test('maps mode "formdata" (multipart) from body.formdata', () => {
      const collection = convertPostmanToCollection({
        info: { name: 'Coll' },
        item: [
          {
            name: 'Req',
            request: {
              method: 'POST',
              url: 'https://api.example.com/upload',
              body: {
                mode: 'formdata',
                formdata: [{ key: 'file', value: 'contents', type: 'text' }],
              },
            },
          },
        ],
      });
      const body = collection.requests[0].request.body;
      assert.equal(body.type, 'form-data');
      assert.equal(body.formEncoding, 'multipart');
      assert.equal(body.formData?.[0].key, 'file');
    });

    test('maps mode "raw" from body.raw', () => {
      const collection = convertPostmanToCollection({
        info: { name: 'Coll' },
        item: [
          {
            name: 'Req',
            request: {
              method: 'POST',
              url: 'https://api.example.com/raw',
              body: { mode: 'raw', raw: '<xml/>' },
            },
          },
        ],
      });
      const body = collection.requests[0].request.body;
      assert.equal(body.type, 'raw');
      assert.equal(body.rawBody, '<xml/>');
    });

    test('nested folders are flattened into a single request list', () => {
      const collection = convertPostmanToCollection({
        info: { name: 'Coll' },
        item: [
          {
            name: 'Folder',
            item: [
              { name: 'Inner', request: { method: 'GET', url: 'https://api.example.com/inner' } },
            ],
          },
        ],
      });
      assert.equal(collection.requests.length, 1);
      assert.equal(collection.requests[0].name, 'Inner');
    });
  });
});
